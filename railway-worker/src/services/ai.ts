import axios from 'axios';

interface ModerationResult {
    shouldModerate: boolean;
    reason?: string;
    confidence: number;
    categories?: string[];
}

export async function moderateWithAI(
    text: string,
    context?: string
): Promise<ModerationResult> {
    // TODO: Implement AI moderation using your preferred AI service
    // Options:
    // 1. OpenAI Moderation API
    // 2. Google Cloud Natural Language API
    // 3. Azure Content Moderator
    // 4. Custom model

    // Example with OpenAI Moderation API:
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await axios.post(
                'https://api.openai.com/v1/moderations',
                { input: text },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const result = response.data.results[0];
            const flagged = result.flagged;
            const categories = Object.keys(result.categories).filter(
                key => result.categories[key]
            );

            return {
                shouldModerate: flagged,
                reason: categories.length > 0 ? `Flagged for: ${categories.join(', ')}` : undefined,
                confidence: Math.max(...Object.values(result.category_scores as Record<string, number>)),
                categories,
            };
        } catch (error) {
            console.error('OpenAI moderation error:', error);
            throw error;
        }
    }

    // Fallback: Simple keyword-based moderation
    const badWords = ['spam', 'scam', 'hate', 'offensive'];
    const lowerText = text.toLowerCase();
    const matched = badWords.some(word => lowerText.includes(word));

    return {
        shouldModerate: matched,
        reason: matched ? 'Matched prohibited keywords' : undefined,
        confidence: matched ? 0.8 : 0.2,
        categories: matched ? ['keyword-match'] : [],
    };
}
