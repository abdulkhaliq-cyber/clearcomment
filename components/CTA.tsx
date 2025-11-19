export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Ready to Clean Up Your Comments?
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial today. No credit card required. Cancel anytime.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-xl font-semibold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
              Start Free Trial
            </button>
            <button className="bg-white text-gray-800 px-10 py-5 rounded-xl font-semibold text-xl border-2 border-gray-200 hover:border-blue-600 hover:shadow-lg transition-all duration-200">
              Schedule Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm font-semibold text-gray-700">Bank-Level Security</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-sm font-semibold text-gray-700">Instant Setup</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <div className="text-sm font-semibold text-gray-700">24/7 Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


