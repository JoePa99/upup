export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const hrTemplates = [
      {
        id: 'job-posting-template',
        title: 'Professional Job Posting Template',
        category: 'Recruitment',
        description: 'Comprehensive job posting template for attracting quality candidates',
        content: `# [Job Title] - [Company Name]

## About [Company Name]
[Company Name] is a [brief company description that highlights culture, mission, and what makes the company unique]. We're looking for a talented [Job Title] to join our growing team and contribute to our mission of [company mission/value proposition].

## Role Overview
We are seeking a [Job Title] who will [primary responsibility/impact]. This role is perfect for someone who [ideal candidate characteristics] and wants to [growth opportunity/career development aspect].

## Key Responsibilities
• [Primary responsibility that directly impacts business results]
• [Secondary responsibility with clear deliverables]
• [Collaborative responsibility showing team integration]
• [Growth/development responsibility showing career progression]
• [Strategic responsibility demonstrating impact]

## Required Qualifications
• [Essential experience requirement with specific years/type]
• [Critical skill requirement with proficiency level]
• [Educational requirement if truly necessary]
• [Industry knowledge requirement if applicable]

## Preferred Qualifications
• [Desirable experience that would accelerate success]
• [Additional skills that would enhance performance]
• [Certifications or specializations that add value]
• [Personal qualities that align with company culture]

## What We Offer
• Competitive salary: $[range] based on experience
• [Specific benefits that differentiate your company]
• [Professional development opportunities]
• [Work-life balance features]
• [Unique company perks or culture elements]

## How to Apply
Please send your resume and a brief cover letter explaining why you're interested in this role and what unique value you would bring to our team. Applications should be sent to [email] with the subject line "[Job Title] Application - [Your Name]".

We are committed to creating a diverse and inclusive workplace and encourage applications from all qualified candidates regardless of race, gender, age, religion, sexual orientation, or disability status.

*Expected start date: [Date]*
*Application deadline: [Date]*`
      },
      {
        id: 'performance-review-template',
        title: 'Annual Performance Review Template',
        category: 'Performance Management',
        description: 'Structured performance review template for comprehensive employee evaluation',
        content: `# Annual Performance Review: [Employee Name]
**Review Period**: [Start Date] - [End Date]
**Position**: [Job Title]
**Department**: [Department Name]
**Reviewer**: [Manager Name]
**Review Date**: [Review Date]

## Executive Summary
[Brief overview of employee's overall performance, key achievements, and areas for development during the review period]

## Goal Achievement Review
### Goal 1: [Original Goal Description]
**Target**: [Specific target/metric]
**Achievement**: [Actual result]
**Rating**: ☐ Exceeded ☐ Met ☐ Partially Met ☐ Not Met
**Comments**: [Specific examples and impact]

### Goal 2: [Original Goal Description]
**Target**: [Specific target/metric]
**Achievement**: [Actual result]
**Rating**: ☐ Exceeded ☐ Met ☐ Partially Met ☐ Not Met
**Comments**: [Specific examples and impact]

### Goal 3: [Original Goal Description]
**Target**: [Specific target/metric]
**Achievement**: [Actual result]
**Rating**: ☐ Exceeded ☐ Met ☐ Partially Met ☐ Not Met
**Comments**: [Specific examples and impact]

## Core Competency Assessment
### Technical Skills
**Rating**: ☐ Excellent ☐ Good ☐ Satisfactory ☐ Needs Improvement
**Evidence**: [Specific examples of technical competency demonstration]
**Development Areas**: [Areas for technical skill enhancement]

### Communication
**Rating**: ☐ Excellent ☐ Good ☐ Satisfactory ☐ Needs Improvement
**Evidence**: [Examples of effective communication, presentation, collaboration]
**Development Areas**: [Communication skills to strengthen]

### Leadership/Initiative
**Rating**: ☐ Excellent ☐ Good ☐ Satisfactory ☐ Needs Improvement
**Evidence**: [Examples of leadership, initiative-taking, influence]
**Development Areas**: [Leadership growth opportunities]

### Problem Solving
**Rating**: ☐ Excellent ☐ Good ☐ Satisfactory ☐ Needs Improvement
**Evidence**: [Examples of creative problem-solving and analytical thinking]
**Development Areas**: [Problem-solving skills to develop]

## Major Accomplishments
1. [Specific achievement with quantifiable impact]
2. [Innovation or improvement initiative led or contributed to]
3. [Recognition received or milestone reached]

## Areas for Development
1. [Specific skill or competency to strengthen with suggested resources]
2. [Behavioral or performance area for improvement with action steps]
3. [Professional development opportunity aligned with career goals]

## Goals for Next Review Period
### Goal 1: [SMART Goal Description]
**Measurable Outcome**: [Specific metric or deliverable]
**Timeline**: [Completion date]
**Resources Needed**: [Support, training, or resources required]

### Goal 2: [SMART Goal Description]
**Measurable Outcome**: [Specific metric or deliverable]
**Timeline**: [Completion date]
**Resources Needed**: [Support, training, or resources required]

### Goal 3: [SMART Goal Description]
**Measurable Outcome**: [Specific metric or deliverable]
**Timeline**: [Completion date]
**Resources Needed**: [Support, training, or resources required]

## Career Development Discussion
**Employee's Career Interests**: [Summary of employee's expressed career goals]
**Recommended Development Actions**: [Specific steps for career advancement]
**Timeline for Development**: [When development activities should occur]

## Overall Performance Rating
☐ Outstanding - Consistently exceeds expectations
☐ Excellent - Regularly exceeds expectations
☐ Good - Meets expectations with some areas of excellence
☐ Satisfactory - Consistently meets expectations
☐ Needs Improvement - Below expectations, improvement plan required

## Employee Comments
[Space for employee to provide their perspective on performance, goals, and development]

## Manager Comments
[Additional manager observations, commitment to support employee development]

**Manager Signature**: _________________ **Date**: _______
**Employee Signature**: _________________ **Date**: _______

*Employee signature indicates receipt and discussion of review, not necessarily agreement with all content*`
      },
      {
        id: 'employee-handbook-section',
        title: 'Employee Handbook Section Template',
        category: 'Policies',
        description: 'Template for creating comprehensive employee handbook sections',
        content: `# [Policy/Section Title]

## Purpose and Scope
This policy outlines [clear statement of what the policy covers and why it exists]. This policy applies to [who is covered by the policy - all employees, specific roles, etc.] and is effective as of [date].

## Policy Statement
[Company Name] is committed to [core principle or value that drives this policy]. We believe that [philosophical foundation that explains why this policy matters for the organization and employees].

## Definitions
**[Key Term 1]**: [Clear definition of important terms used in the policy]
**[Key Term 2]**: [Definition that eliminates ambiguity]
**[Key Term 3]**: [Specific meaning within company context]

## Policy Details

### [Subsection Title]
[Detailed explanation of specific policy requirements, procedures, or guidelines. Be specific about what is required, optional, or prohibited.]

### [Subsection Title]
[Additional policy details with clear expectations and procedures]

### [Subsection Title]
[Further specifications including any exceptions or special circumstances]

## Employee Responsibilities
• [Specific action or behavior expected from employees]
• [Clear requirement with measurable standards when possible]
• [Responsibility that supports policy compliance]
• [Expectation that maintains policy effectiveness]

## Manager/Supervisor Responsibilities
• [Specific oversight or enforcement responsibilities]
• [Support or resources managers should provide]
• [Escalation procedures for policy violations]
• [Training or communication responsibilities]

## Procedures
### How to [Specific Process]
1. [Step-by-step procedure for common policy-related process]
2. [Clear action with responsible party identified]
3. [Timeline or deadline requirements]
4. [Documentation or approval requirements]

### When to [Alternative Process]
1. [Different procedure for different circumstances]
2. [Clear criteria for when this process applies]
3. [Required approvals or notifications]

## Non-Compliance and Disciplinary Action
Failure to comply with this policy may result in [specific consequences ranging from verbal warning to termination, depending on severity]. Progressive discipline will typically follow this sequence:
1. **Verbal Warning**: [Description of when and how]
2. **Written Warning**: [Escalation criteria and process]
3. **Final Written Warning**: [Serious violations or repeated non-compliance]
4. **Termination**: [Circumstances that warrant immediate dismissal]

## Resources and Support
• **Questions about this policy**: Contact [specific person/role] at [contact information]
• **Training resources**: [Available training or educational materials]
• **Forms and documents**: [Where to find required forms or templates]
• **Additional support**: [Employee assistance programs, legal resources, etc.]

## Policy Review and Updates
This policy will be reviewed annually by [responsible party] and updated as necessary to reflect changes in law, business practices, or organizational needs. Employees will be notified of any policy changes through [communication method].

## Related Policies
• [Link to related company policies]
• [Reference to relevant employee handbook sections]
• [Connection to legal compliance requirements]

---
**Policy Effective Date**: [Date]
**Last Reviewed**: [Date]
**Next Review Date**: [Date]
**Policy Owner**: [Department/Role responsible for policy]
**Approved By**: [Senior leadership approval]

*This policy does not constitute a contract of employment and may be modified at the company's discretion with appropriate notice to employees.*`
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        templates: hrTemplates,
        total: hrTemplates.length,
        category: 'Human Resources'
      }
    });

  } catch (error) {
    console.error('HR templates error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve HR templates',
      error: error.message
    });
  }
}