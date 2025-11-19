export default function Benefits() {
  const benefits = [
    {
      title: "Save Time & Resources",
      description: "Stop manually monitoring comments 24/7. AutoModly handles everything automatically, freeing up hours of your time every day.",
      icon: "⏰",
    },
    {
      title: "Protect Your Brand",
      description: "Prevent harmful content from damaging your reputation. Keep your social media professional and welcoming at all times.",
      icon: "🛡️",
    },
    {
      title: "Increase Engagement",
      description: "A clean, safe comment section encourages more positive interactions and builds a stronger community around your brand.",
      icon: "📈",
    },
    {
      title: "Peace of Mind",
      description: "Sleep better knowing your social media is protected around the clock, even when you're offline or busy.",
      icon: "😌",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Why Choose AutoModly?
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Join thousands of brands and creators who trust AutoModly to protect their social media presence.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{benefit.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
              <p className="text-blue-100 text-lg leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Testimonial Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex-shrink-0 flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-xl md:text-2xl font-medium mb-4 leading-relaxed">
                  "AutoModly has been a game-changer for our social media presence. We've seen a 90% reduction in spam comments and our engagement has increased significantly. Highly recommend!"
                </p>
                <div>
                  <div className="font-bold text-lg">Sarah Johnson</div>
                  <div className="text-blue-200">Social Media Manager, TechCorp</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


