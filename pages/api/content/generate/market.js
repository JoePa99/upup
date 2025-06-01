export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { analysisFocus, marketScope, specificCompetitors } = req.body;

    if (!analysisFocus || !marketScope) {
      return res.status(400).json({
        message: 'Missing required fields: analysisFocus, marketScope'
      });
    }

    // Generate market insights based on input
    const mockContent = generateMarketInsights(analysisFocus, marketScope, specificCompetitors);

    return res.status(200).json({
      success: true,
      data: {
        content: mockContent.content,
        title: mockContent.title,
        metadata: {
          generatedAt: new Date().toISOString(),
          analysisFocus,
          marketScope,
          competitors: specificCompetitors || 'general competitors'
        }
      }
    });

  } catch (error) {
    console.error('Market insights generation error:', error);
    return res.status(500).json({
      message: 'Market insights generation failed',
      error: error.message
    });
  }
}

function generateMarketInsights(focus, scope, competitors) {
  const insights = {
    'Customer Behavior': {
      'Current Market': `Customer behavior in the current market reveals a fundamental shift toward quality-over-quantity purchasing decisions, particularly among professionals who view tools as investments in their success. Today's customers research extensively before making purchases, often spending weeks evaluating options and reading reviews from peers before committing to premium brands.

Key Behavioral Patterns:
• Decision-making heavily influenced by peer recommendations and social proof
• Price sensitivity decreases when customers understand quality-outcome connection
• Younger professionals prioritize brands with authentic heritage and sustainability
• Digital research precedes offline purchases, with customers seeking detailed specifications
• Strong brand loyalty develops once products consistently meet requirements

Competitive Landscape:
${competitors ? `Your main competitors (${competitors}) are competing primarily on` : 'Key competitive factors include:'} price positioning, product innovation, and customer experience. Professional customers value detailed product information over lifestyle marketing, creating opportunities for brands with comprehensive education and demonstration strategies.

Purchase Timing & Patterns:
• Buying cycles align with project schedules and seasonal patterns
• Repeat purchase rates significantly higher for satisfied premium customers
• Professional networks serve as primary influence source for new purchases`,

      'Emerging Opportunities': `Emerging market opportunities in customer behavior indicate a growing demand for premium, purpose-driven products among next-generation professionals. This demographic shift creates significant potential for companies that can authentically connect quality craftsmanship with modern professional needs.

Market Opportunity Analysis:
• 73% growth in premium tool purchases among professionals under 35
• Increasing willingness to pay premium for sustainable and ethically-made products
• Rising demand for hybrid digital-physical experiences in the purchasing journey
• Professional development budgets increasingly allocated to quality tools and equipment

Competitive Positioning:
${competitors ? `Against competitors like ${competitors}, positioning` : 'Strategic positioning'} should emphasize authentic heritage, proven performance, and long-term value. Emerging customers seek brands that understand their evolving work patterns and can demonstrate clear ROI on premium purchases.

Strategic Recommendations:
• Develop educational content showcasing long-term value and professional benefits
• Create demonstration programs allowing hands-on experience before purchase
• Build community platforms for peer recommendations and success stories
• Establish partnerships with professional development programs and educational institutions`
    },

    'Competitive Analysis': {
      'Current Market': `Current competitive landscape analysis reveals a market increasingly segmented between value-focused mass market players and premium quality-oriented brands. Professional customers show clear preference patterns that create strategic opportunities for positioned brands.

Competitive Dynamics:
• Mass market competitors compete primarily on price and availability
• Premium segment differentiated by quality, heritage, and professional endorsement
• Growing gap between budget and premium segments creates opportunity for mid-tier positioning
• Digital-native brands gaining share through superior online experience and education

${competitors ? `Specific Analysis of ${competitors}:
Your identified competitors are likely positioning on similar quality and professional appeal. Key differentiation opportunities include customer education, authentic storytelling, and superior post-purchase support.` : ''}

Market Positioning Opportunities:
• Professional endorsement and case studies proving ROI
• Comprehensive education demonstrating proper usage and care
• Superior customer service and lifetime support programs
• Authentic heritage storytelling that resonates with quality-conscious buyers
• Hybrid online-offline experience that combines convenience with hands-on evaluation`,

      'Future Trends': `Future competitive landscape will be shaped by evolving professional work patterns, sustainability requirements, and generational preferences. Companies that anticipate and adapt to these trends will gain significant competitive advantages.

Emerging Competitive Factors:
• Sustainability and ethical manufacturing becoming table stakes for premium positioning
• Direct-to-consumer models enabling better margins and customer relationships
• AI and digital tools enhancing rather than replacing quality traditional products
• Professional community building becoming key differentiation strategy

${competitors ? `Future Competition with ${competitors}:
Your competitive advantage will increasingly depend on authentic differentiation and community building rather than pure product features.` : ''}

Strategic Trend Implications:
• Quality storytelling becomes more important than traditional advertising
• Professional network influence grows stronger than mass media impact
• Post-purchase experience and community building drive repeat business
• Hybrid digital-physical customer journeys require seamless integration
• Sustainability credentials become minimum requirement for premium positioning`
    }
  };

  const selectedInsight = insights[focus] && insights[focus][scope] 
    ? insights[focus][scope] 
    : insights['Customer Behavior']['Current Market'];

  return {
    title: `Market Analysis: ${focus} - ${scope}`,
    content: selectedInsight
  };
}