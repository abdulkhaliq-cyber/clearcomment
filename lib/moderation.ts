import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";

// Types
type ActionType = "HIDE" | "DELETE" | "REPLY";

interface ModerationResult {
    actionPerformed: boolean;
    actionType?: ActionType;
    ruleId?: string;
    error?: string;
}

/**
 * Core moderation engine.
 * Checks a comment against a page's rules and executes actions via Facebook Graph API.
 */
export async function moderateComment(
    pageId: string, // Internal DB Page ID
    commentId: string, // Facebook Comment ID
    message: string,
    accessTokenEncrypted: string
): Promise<ModerationResult> {
    try {
        // 1. Fetch active rules for this page
        const rules = await prisma.moderationRule.findMany({
            where: {
                pageId: pageId,
                isEnabled: true,
            },
        });

        if (rules.length === 0) {
            return { actionPerformed: false };
        }

        const accessToken = decrypt(accessTokenEncrypted);
        const lowerMessage = message.toLowerCase();
        let actionTaken: ActionType | null = null;
        let matchedRuleId: string | null = null;

        // 2. Check BLOCK_KEYWORD rules
        // We prioritize blocking over replying
        for (const rule of rules) {
            if (rule.type === "BLOCK_KEYWORD" && rule.keyword) {
                if (lowerMessage.includes(rule.keyword.toLowerCase())) {
                    // Match found! Hide the comment.
                    const success = await performFacebookAction(commentId, "HIDE", accessToken);
                    if (success) {
                        actionTaken = "HIDE";
                        matchedRuleId = rule.id;
                        break; // Stop processing other rules
                    }
                }
            }
        }

        // 3. If not blocked, check AUTO_REPLY rules
        // (Only if we haven't already taken an action)
        if (!actionTaken) {
            for (const rule of rules) {
                if (rule.type === "AUTO_REPLY" && rule.keyword && rule.replyText) {
                    if (lowerMessage.includes(rule.keyword.toLowerCase())) {
                        const success = await performFacebookAction(commentId, "REPLY", accessToken, rule.replyText);
                        if (success) {
                            actionTaken = "REPLY";
                            matchedRuleId = rule.id;
                            break;
                        }
                    }
                }
            }
        }

        // 4. Log the action if one was taken
        if (actionTaken && matchedRuleId) {
            await prisma.moderationLog.create({
                data: {
                    pageId: pageId,
                    action: actionTaken,
                    commentId: commentId,
                    commentText: message.substring(0, 200),
                },
            });

            // Update local comment state
            if (actionTaken === "HIDE") {
                await prisma.comment.update({
                    where: { id: commentId },
                    data: { isHidden: true }
                }).catch(e => console.error("Failed to update local comment state", e));
            }

            return { actionPerformed: true, actionType: actionTaken, ruleId: matchedRuleId };
        }

        return { actionPerformed: false };

    } catch (error: any) {
        console.error("Moderation engine error:", error);
        return { actionPerformed: false, error: error.message };
    }
}

/**
 * Helper to call Facebook Graph API
 */
async function performFacebookAction(
    commentId: string,
    action: ActionType,
    accessToken: string,
    replyMessage?: string
): Promise<boolean> {
    const fbApiUrl = `https://graph.facebook.com/v19.0/${commentId}`;

    try {
        let res;
        if (action === "HIDE") {
            res = await fetch(fbApiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ is_hidden: true, access_token: accessToken }),
            });
        } else if (action === "DELETE") {
            res = await fetch(`${fbApiUrl}?access_token=${accessToken}`, {
                method: "DELETE",
            });
        } else if (action === "REPLY" && replyMessage) {
            res = await fetch(`${fbApiUrl}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: replyMessage, access_token: accessToken }),
            });
        }

        if (!res || !res.ok) {
            const err = await res?.json();
            console.error(`Facebook API failed for ${action}:`, err);
            return false;
        }

        return true;
    } catch (error) {
        console.error(`Network error performing ${action}:`, error);
        return false;
    }
}
