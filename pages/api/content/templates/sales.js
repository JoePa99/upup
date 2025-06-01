export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const salesTemplates = [
      {
        id: 'sales-proposal-template',
        title: 'Professional Sales Proposal Template',
        category: 'Proposals',
        description: 'Comprehensive template for winning sales proposals',
        content: `# BUSINESS PROPOSAL
**Prepared for**: [Client Company Name]
**Prepared by**: [Your Company Name]
**Date**: [Date]
**Proposal Valid Until**: [Expiration Date]

## EXECUTIVE SUMMARY
[Client Company Name] is looking to [summarize client's main challenge or goal]. Based on our consultation and understanding of your needs, [Your Company Name] proposes [brief solution overview] that will [key benefit/outcome].

Our solution will deliver:
• [Primary benefit with quantifiable impact]
• [Secondary benefit that addresses key pain point]
• [Third benefit that provides competitive advantage]

**Investment**: $[Total Amount]
**Timeline**: [Project Duration]
**Expected ROI**: [Percentage or dollar amount within timeframe]

## UNDERSTANDING YOUR CHALLENGES
Through our discussions, we understand that [Client Company Name] is facing:

### Primary Challenge
[Detailed description of main business challenge, its impact on operations, and cost of not addressing it]

### Secondary Challenges
• [Supporting challenge that amplifies the primary issue]
• [Operational challenge affecting efficiency]
• [Strategic challenge limiting growth potential]

### Impact of Current Situation
• **Financial Impact**: [Quantify current costs or lost revenue]
• **Operational Impact**: [Describe efficiency or productivity losses]
• **Strategic Impact**: [Explain competitive disadvantage or missed opportunities]

## OUR PROPOSED SOLUTION

### Solution Overview
[Comprehensive description of your proposed solution, explaining how it directly addresses each identified challenge]

### Phase 1: [Phase Name] (Duration: [Timeframe])
**Objectives**: [What will be accomplished in this phase]
**Key Activities**:
• [Specific activity with clear deliverable]
• [Implementation step with measurable outcome]
• [Setup or configuration task with timeline]

**Deliverables**:
• [Specific deliverable with completion criteria]
• [Documentation or report to be provided]
• [Training or handover activity]

### Phase 2: [Phase Name] (Duration: [Timeframe])
**Objectives**: [Phase 2 goals building on Phase 1 success]
**Key Activities**:
• [Advanced implementation with specific outcomes]
• [Optimization or enhancement activities]
• [Integration or scaling initiatives]

**Deliverables**:
• [Phase 2 specific deliverables]
• [Performance reports or analytics]
• [Ongoing support documentation]

### Phase 3: [Phase Name] (Duration: [Timeframe])
**Objectives**: [Final phase goals for full solution deployment]
**Key Activities**:
• [Completion and optimization activities]
• [Knowledge transfer and training]
• [Performance monitoring and adjustment]

**Deliverables**:
• [Final deliverables and documentation]
• [Training materials and sessions]
• [Ongoing support and maintenance plan]

## WHY CHOOSE [YOUR COMPANY NAME]

### Our Expertise
• [Specific expertise relevant to client's industry or challenge]
• [Years of experience with quantifiable results]
• [Relevant certifications, awards, or recognition]
• [Unique methodology or approach that provides advantage]

### Proven Track Record
**Case Study: [Similar Client Name]**
• **Challenge**: [Brief description of similar challenge]
• **Solution**: [How you solved it]
• **Results**: [Quantifiable improvements achieved]

**Client Testimonial**:
"[Powerful testimonial from satisfied client that addresses similar challenges and demonstrates results]" - [Name, Title, Company]

### Our Approach
• **Collaborative Partnership**: We work as an extension of your team
• **Proven Methodology**: [Name of methodology] ensures consistent results
• **Ongoing Support**: Dedicated support throughout and after implementation
• **Risk Mitigation**: [Specific measures to minimize project risks]

## INVESTMENT AND VALUE

### Investment Breakdown
| Phase | Description | Investment | Timeline |
|-------|-------------|------------|----------|
| Phase 1 | [Phase 1 Name] | $[Amount] | [Duration] |
| Phase 2 | [Phase 2 Name] | $[Amount] | [Duration] |
| Phase 3 | [Phase 3 Name] | $[Amount] | [Duration] |
| **Total** | **Complete Solution** | **$[Total]** | **[Total Duration]** |

### Payment Terms
• Initial payment: [Percentage]% ($[Amount]) upon contract signing
• Phase completions: [Percentage]% ($[Amount]) upon each phase completion
• Final payment: [Percentage]% ($[Amount]) upon project completion

### Return on Investment
**Year 1 Benefits**:
• [Specific benefit with dollar value]: $[Amount]
• [Efficiency gain with cost savings]: $[Amount]
• [Revenue improvement opportunity]: $[Amount]
• **Total Year 1 Value**: $[Amount]

**ROI Calculation**: [Total Benefits] ÷ [Investment] = [ROI Percentage]%
**Payback Period**: [Number] months

## TIMELINE AND NEXT STEPS

### Project Timeline
• **Week 1-2**: Contract finalization and project kickoff
• **Week 3-[X]**: Phase 1 implementation
• **Week [X]-[Y]**: Phase 2 implementation  
• **Week [Y]-[Z]**: Phase 3 implementation and completion

### Immediate Next Steps
1. **Review Proposal**: Please review this proposal and prepare any questions
2. **Discovery Call**: Schedule follow-up call to discuss details (by [Date])
3. **Contract Finalization**: Execute agreement to begin work (by [Date])
4. **Project Kickoff**: Begin implementation (target date: [Date])

## TERMS AND CONDITIONS

### What's Included
• All services and deliverables outlined in this proposal
• [Specific inclusions that add value]
• [Training or support elements]
• [Warranty or guarantee terms]

### What's Not Included
• [Specific exclusions to prevent scope creep]
• [Additional services available separately]
• [Client responsibilities or requirements]

### Assumptions
• [Key assumptions about client environment or resources]
• [Availability requirements from client team]
• [Technical or operational prerequisites]

## APPROVAL AND ACCEPTANCE

**Proposal Valid Until**: [Date]

To accept this proposal and begin work:
1. Sign and return the attached contract
2. Submit initial payment of $[Amount]
3. Designate primary project contact
4. Schedule project kickoff meeting

**Questions?** Contact [Name] at [Phone] or [Email]

---

**Prepared by**: [Your Name, Title]
**[Your Company Name]**
**Phone**: [Phone Number]
**Email**: [Email Address]
**Website**: [Website URL]

*This proposal contains confidential and proprietary information. Please do not share without written permission.*`
      },
      {
        id: 'sales-email-sequence',
        title: 'Follow-Up Email Sequence Template',
        category: 'Email Marketing',
        description: 'Multi-touch email sequence for nurturing prospects',
        content: `# SALES FOLLOW-UP EMAIL SEQUENCE

## EMAIL 1: INTRODUCTION & VALUE (Send Immediately)
**Subject**: Quick question about [Company Name]'s [specific challenge/goal]

Hi [First Name],

I noticed that [Company Name] has been [specific observation about their business, recent news, or growth]. Congratulations on [specific achievement if applicable]!

I'm reaching out because we help companies like yours [specific benefit relevant to their situation]. For example, we recently helped [similar company] achieve [specific result] in just [timeframe].

I'd love to learn more about your current [relevant business area] and see if there might be a fit. Would you be open to a brief 15-minute conversation this week?

Best regards,
[Your Name]
[Title]
[Phone Number]

P.S. Here's a [relevant resource/case study] that might interest you: [Link]

---

## EMAIL 2: EDUCATIONAL VALUE (Send 3 days after Email 1)
**Subject**: [Industry insight] that could impact [Company Name]

Hi [First Name],

I hope you're having a great week! I wanted to share a quick insight that's been on my mind since researching [Company Name].

Did you know that [relevant industry statistic or trend]? This is particularly relevant for companies in [their industry] because [explanation of impact].

We've seen companies address this by:
• [Strategy 1 with brief explanation]
• [Strategy 2 with brief explanation]  
• [Strategy 3 with brief explanation]

[Company Name] is already ahead of many competitors in [specific area], so you're well-positioned to [benefit/opportunity].

Would you like to discuss how other companies in your space are navigating this trend? I'm happy to share some specific examples.

Best,
[Your Name]

P.S. Attached is a brief guide on [relevant topic] that you might find useful.

---

## EMAIL 3: SOCIAL PROOF & CASE STUDY (Send 1 week after Email 2)
**Subject**: How [Similar Company] increased [relevant metric] by [percentage]

Hi [First Name],

I thought you'd find this case study interesting given [Company Name]'s focus on [relevant business area].

[Similar Company Name], a [company description similar to prospect], was struggling with [challenge similar to prospect's likely challenges]. Sound familiar?

Here's what we did together:
• **Challenge**: [Specific challenge description]
• **Solution**: [Brief solution overview]
• **Results**: [Specific quantifiable results]

The CEO told us: "[Powerful quote about results or experience]"

The best part? We implemented this solution in just [timeframe] without disrupting their daily operations.

I'm curious - how are you currently handling [similar challenge] at [Company Name]? Would you be interested in a brief conversation about your approach?

Best regards,
[Your Name]

---

## EMAIL 4: DIRECT VALUE OFFER (Send 1 week after Email 3)
**Subject**: Free [assessment/analysis] for [Company Name]

Hi [First Name],

I've been thinking about [Company Name] and your [specific business focus/challenge mentioned if known].

I'd like to offer you something valuable with no strings attached:

**A complimentary [assessment/analysis/audit] of your [relevant business area]**

This typically includes:
• [Specific analysis component]
• [Benchmarking against industry standards]
• [Specific recommendations report]
• [30-minute results discussion]

I've done similar analyses for [number] companies in [industry], and they've found it incredibly valuable for [specific benefit].

Even if we never work together, you'll walk away with actionable insights that could [specific potential improvement].

Are you interested? It would take about [time commitment] on your end, and I'll handle the rest.

Best,
[Your Name]

P.S. Here's what [previous client] said about their analysis: "[Brief testimonial]"

---

## EMAIL 5: URGENCY/SCARCITY (Send 1 week after Email 4)
**Subject**: Last attempt - opportunity closing [Date]

Hi [First Name],

I've reached out a few times about [specific value proposition] for [Company Name], but I understand you're busy.

I wanted to give you one final heads up about an opportunity that closes [Date]:

[Specific limited-time offer, discount, or exclusive opportunity]

This is particularly relevant for [Company Name] because [specific reason related to their business].

After [Date], [what changes - price increase, availability, etc.].

If you're interested in exploring this, just reply with "Tell me more" and I'll send details.

If now isn't the right time, I understand. Should I follow up in [time period] instead?

Best regards,
[Your Name]

---

## EMAIL 6: BREAK-UP EMAIL (Send 1 week after Email 5)
**Subject**: Closing your file

Hi [First Name],

I haven't heard back from you, so I'm assuming [specific challenge/opportunity] isn't a priority for [Company Name] right now.

That's totally fine - timing is everything in business.

I'm going to close your file for now, but please don't hesitate to reach out if:
• Your priorities change
• You'd like to discuss [relevant topic] in the future
• You need a referral for [related service you don't provide]

Thanks for your time, and I wish you continued success with [Company Name].

Best,
[Your Name]

P.S. One final resource that might be helpful: [Link to valuable content]

---

## FOLLOW-UP GUIDELINES

### Timing
• Email 1: Immediate after initial contact/research
• Email 2: 3 days after Email 1 (if no response)
• Email 3: 1 week after Email 2 (if no response)
• Email 4: 1 week after Email 3 (if no response)
• Email 5: 1 week after Email 4 (if no response)
• Email 6: 1 week after Email 5 (if no response)

### Customization Tips
• Always personalize the company name and contact name
• Reference specific details about their business when possible
• Adjust industry examples and case studies to match their sector
• Modify statistics and trends to be relevant to their market
• Include genuine compliments or observations about their business

### Response Handling
• **Positive Response**: Move to discovery call scheduling
• **Not Interested**: Ask about future timing and preferred contact method
• **Wrong Person**: Ask for referral to correct decision maker
• **No Response**: Continue sequence as planned

### Success Metrics to Track
• Open rates by email in sequence
• Response rates (positive and negative)
• Conversion to discovery calls
• Overall sequence completion rates`
      },
      {
        id: 'discovery-call-script',
        title: 'Discovery Call Script Template',
        category: 'Sales Process',
        description: 'Structured approach for effective discovery calls',
        content: `# DISCOVERY CALL SCRIPT TEMPLATE

## PRE-CALL PREPARATION
### Research Checklist (Complete before call)
- [ ] Company website review (services, recent news, leadership)
- [ ] LinkedIn profiles of attendees
- [ ] Industry trends and challenges relevant to their business
- [ ] Recent company news, press releases, or announcements
- [ ] Potential pain points based on industry and company size
- [ ] Competitive landscape understanding

### Call Objectives
**Primary Goal**: Understand their current situation, challenges, and decision-making process
**Secondary Goals**: 
• Build rapport and establish credibility
• Qualify budget, authority, need, and timeline (BANT)
• Position our solution as relevant to their needs
• Secure next steps (proposal, demo, or additional meeting)

---

## CALL STRUCTURE (45-60 minutes)

### OPENING (5 minutes)
**Build Rapport**
"Hi [Name], thanks for taking the time to speak with me today. How's your week going?"

[Listen and respond genuinely to their answer]

**Set Agenda**
"I've got about [X] minutes blocked out for our conversation. I'd love to learn more about [Company Name] and your current [relevant business area], share a bit about what we do, and see if there might be a fit. Does that sound good?"

**Confirm Time**
"Is [X] minutes still good for you, or do you have a hard stop before then?"

### DISCOVERY QUESTIONS (25-30 minutes)

#### Current Situation
"Tell me about your role at [Company Name] and what your typical day looks like."

"How is [relevant business area] currently handled at your company?"

"What systems/processes/tools are you using now for [relevant area]?"

#### Challenges and Pain Points
"What's working well with your current approach?"

"What's not working as well as you'd like?"

"If you could wave a magic wand and fix one thing about [relevant area], what would it be?"

"How is [challenge] impacting your business/team/results?"

"What have you tried in the past to address this?"

#### Goals and Objectives
"What are your main goals for [relevant area] this year?"

"What would success look like to you?"

"How would achieving this goal impact your business?"

"What's driving this to be a priority now?"

#### Decision-Making Process
"Who else is involved in decisions like this?"

"What's your typical process for evaluating [solution type]?"

"Have you looked at other solutions? What did you think?"

"What would need to happen for you to move forward with a solution?"

#### Budget and Timeline
"Do you have a budget allocated for addressing this challenge?"

"What range are you comfortable investing to solve this problem?"

"What's your ideal timeline for implementing a solution?"

"What happens if you don't address this issue this year?"

### SOLUTION POSITIONING (10-15 minutes)

#### Connect to Their Needs
"Based on what you've shared, it sounds like [summarize key challenges]. Is that accurate?"

"This is actually very similar to what we helped [similar company] with recently."

#### Brief Solution Overview
"Here's how we typically address this type of challenge..."

[Share 2-3 key capabilities that directly address their stated needs]

#### Social Proof
"For example, [Client Name] was facing [similar challenge]. We helped them [solution overview], and they saw [specific results] within [timeframe]."

"They told us: '[Brief testimonial that addresses similar challenge]'"

#### Value Proposition
"The key benefits our clients typically see are:
• [Benefit 1 that addresses their primary pain point]
• [Benefit 2 that supports their stated goals]  
• [Benefit 3 that provides additional value]"

### QUALIFICATION AND NEXT STEPS (5-10 minutes)

#### Final Qualification
"Does this sound like something that could be valuable for [Company Name]?"

"What questions do you have about our approach?"

"What concerns, if any, do you have about moving forward?"

#### Secure Next Steps
**If Qualified and Interested:**
"I think there's definitely a fit here. The next step would be [proposal/detailed demo/pilot program]. I'd like to [specific next step] that shows exactly how this would work for [Company Name]."

"Who else should be involved in that conversation?"

"What's your availability next week for [next step duration]?"

**If Not Ready:**
"I understand this isn't urgent right now. When would be a good time to revisit this conversation?"

"What would need to change for this to become a priority?"

"Is it helpful if I check back in [timeframe]?"

### CLOSING (5 minutes)
**Summarize Key Points**
"Let me summarize what I heard today: [key challenges, goals, timeline, decision process]"

**Confirm Next Steps**
"So our next step is [specific action] on [specific date]. I'll [your action items], and you'll [their action items]."

**Thank and Close**
"Thanks again for your time today, [Name]. I'm excited about the possibility of working together."

---

## POST-CALL ACTIONS

### Immediate Follow-Up (Within 2 hours)
- [ ] Send thank you email with meeting summary
- [ ] Include any promised resources or information
- [ ] Confirm next meeting details and calendar invite
- [ ] Update CRM with call notes and qualification status

### Call Summary Email Template
**Subject**: Thank you for our conversation - next steps

Hi [Name],

Thank you for taking the time to speak with me today about [Company Name]'s [challenge/goal area].

**Key takeaways from our conversation:**
• [Current situation summary]
• [Primary challenges identified]
• [Goals and objectives]
• [Timeline and decision process]

**Next steps:**
• [Your action items with deadlines]
• [Their action items]
• [Next meeting scheduled for Date/Time]

I've attached [promised resource] as discussed. Please let me know if you have any questions before our next conversation.

Looking forward to [next step]!

Best regards,
[Your Name]

---

## COMMON OBJECTIONS AND RESPONSES

### "We're happy with our current solution"
"That's great to hear! What do you like most about it? ... Is there anything you'd improve if you could?"

### "We don't have budget for this"
"I understand budget is always a consideration. Help me understand - is this more about timing, or do you feel the investment wouldn't provide sufficient return?"

### "I need to think about it"
"Of course, this is an important decision. What specific areas would you like to think through? Maybe I can provide some additional information to help."

### "I need to discuss with my team"
"That makes sense. Who else would be involved in this decision? Would it be helpful if I joined that conversation to answer any questions?"

### "The timing isn't right"
"I understand timing is crucial. When do you think would be a better time to revisit this? What would need to change for the timing to be right?"

---

## SUCCESS METRICS
• **Discovery Quality**: How well did you understand their situation?
• **Rapport Building**: Did you establish trust and credibility?
• **Qualification**: Do they meet BANT criteria?
• **Next Steps**: Did you secure a clear next meeting/action?
• **Information Gathering**: Do you have enough detail for an effective proposal?`
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        templates: salesTemplates,
        total: salesTemplates.length,
        category: 'Sales & Marketing'
      }
    });

  } catch (error) {
    console.error('Sales templates error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve sales templates',
      error: error.message
    });
  }
}