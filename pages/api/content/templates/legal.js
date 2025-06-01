export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const legalTemplates = [
      {
        id: 'service-agreement-template',
        title: 'Professional Services Agreement Template',
        category: 'Contracts',
        description: 'Comprehensive template for professional services contracts',
        content: `# PROFESSIONAL SERVICES AGREEMENT

**Agreement Date**: [Date]
**Between**: [Your Company Name] ("Service Provider")
**And**: [Client Company Name] ("Client")

## 1. SERVICES TO BE PROVIDED

### 1.1 Scope of Work
Service Provider agrees to provide the following professional services ("Services"):
• [Specific service or deliverable with clear description]
• [Additional service with measurable outcomes]
• [Third service with timeline and specifications]

### 1.2 Deliverables
The following deliverables will be provided to Client:
• [Specific deliverable with format and delivery method]
• [Additional deliverable with completion criteria]
• [Final deliverable with acceptance requirements]

### 1.3 Timeline
• Project Start Date: [Date]
• Key Milestone 1: [Description] - Due [Date]
• Key Milestone 2: [Description] - Due [Date]
• Project Completion Date: [Date]

## 2. COMPENSATION AND PAYMENT TERMS

### 2.1 Fees
Total project fee: $[Amount]
Payment structure:
• Initial payment: $[Amount] due upon agreement signing
• Milestone payment: $[Amount] due upon [milestone completion]
• Final payment: $[Amount] due upon project completion

### 2.2 Payment Terms
• Invoices are due within [number] days of receipt
• Late payments may incur a charge of [percentage]% per month
• Expenses exceeding $[amount] require prior written approval

## 3. RESPONSIBILITIES

### 3.1 Service Provider Responsibilities
• Perform services in a professional and workmanlike manner
• Provide qualified personnel to perform the services
• Maintain confidentiality of all client information
• Deliver services according to agreed timeline and specifications

### 3.2 Client Responsibilities
• Provide necessary access, information, and resources
• Respond to requests for information within [timeframe]
• Designate a primary contact for project coordination
• Review and approve deliverables within [timeframe]

## 4. INTELLECTUAL PROPERTY
• Client retains ownership of pre-existing intellectual property
• Service Provider retains ownership of pre-existing methodologies and tools
• Work product created specifically for Client becomes Client property upon final payment
• Service Provider may use general knowledge and experience gained

## 5. CONFIDENTIALITY
Both parties agree to maintain confidentiality of proprietary information disclosed during this engagement. This obligation continues for [time period] after agreement termination.

## 6. LIMITATION OF LIABILITY
Service Provider's total liability shall not exceed the total amount paid under this agreement. Neither party shall be liable for indirect, consequential, or punitive damages.

## 7. TERMINATION
Either party may terminate this agreement with [notice period] written notice. Client shall pay for services performed through termination date.

## 8. GENERAL PROVISIONS
• This agreement constitutes the entire agreement between parties
• Any modifications must be in writing and signed by both parties
• Agreement shall be governed by laws of [State/Province]
• Disputes shall be resolved through [arbitration/mediation/court system]

**Service Provider Signature**: _________________ **Date**: _______
[Printed Name and Title]

**Client Signature**: _________________ **Date**: _______
[Printed Name and Title]

*This template is for informational purposes only and should be reviewed by qualified legal counsel before use.*`
      },
      {
        id: 'privacy-policy-template',
        title: 'Website Privacy Policy Template',
        category: 'Privacy & Compliance',
        description: 'GDPR and privacy law compliant privacy policy template',
        content: `# PRIVACY POLICY

**Last Updated**: [Date]
**Effective Date**: [Date]

## 1. INTRODUCTION
[Company Name] ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website [website URL] and use our services.

## 2. INFORMATION WE COLLECT

### 2.1 Information You Provide Directly
• **Contact Information**: Name, email address, phone number, mailing address
• **Account Information**: Username, password, profile preferences
• **Communication Data**: Messages, feedback, survey responses
• **Payment Information**: Billing address, payment method details (processed securely by third parties)

### 2.2 Information Collected Automatically
• **Usage Data**: Pages visited, time spent, click patterns, referral sources
• **Device Information**: Browser type, operating system, IP address, device identifiers
• **Cookies and Tracking**: See our Cookie Policy for detailed information

### 2.3 Information from Third Parties
• **Social Media**: Profile information when you connect social media accounts
• **Business Partners**: Information from authorized partners and service providers
• **Public Sources**: Publicly available information relevant to our business relationship

## 3. HOW WE USE YOUR INFORMATION

We use collected information for the following purposes:
• **Service Delivery**: Provide, maintain, and improve our services
• **Communication**: Respond to inquiries, send updates, provide customer support
• **Personalization**: Customize content and recommendations based on preferences
• **Analytics**: Understand usage patterns and improve user experience
• **Marketing**: Send promotional materials (with your consent where required)
• **Legal Compliance**: Meet legal obligations and protect our rights

## 4. INFORMATION SHARING AND DISCLOSURE

### 4.1 We DO NOT sell your personal information to third parties.

### 4.2 We may share information in the following circumstances:
• **Service Providers**: Trusted third parties who assist in business operations
• **Legal Requirements**: When required by law, court order, or government request
• **Business Transfers**: In connection with merger, acquisition, or asset sale
• **Consent**: When you explicitly authorize information sharing
• **Protection**: To protect our rights, safety, or property, or that of others

## 5. DATA SECURITY
We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.

## 6. YOUR RIGHTS AND CHOICES

### 6.1 Access and Control
• **Access**: Request copies of your personal information
• **Correction**: Update or correct inaccurate information
• **Deletion**: Request deletion of your personal information (subject to legal requirements)
• **Portability**: Receive your information in a structured, machine-readable format

### 6.2 Communication Preferences
• **Email Unsubscribe**: Use unsubscribe links in our emails
• **Account Settings**: Manage preferences through your account dashboard
• **Cookie Control**: Adjust cookie settings through browser preferences

## 7. INTERNATIONAL DATA TRANSFERS
If you are located outside [Country], your information may be transferred to and processed in [Country] where our servers are located. We ensure appropriate safeguards are in place for such transfers.

## 8. RETENTION PERIOD
We retain your information only as long as necessary for the purposes outlined in this policy, or as required by law. Specific retention periods vary based on the type of information and business purpose.

## 9. CHILDREN'S PRIVACY
Our services are not intended for children under 13 (or applicable age in your jurisdiction). We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information.

## 10. THIRD-PARTY LINKS
Our website may contain links to third-party sites. We are not responsible for the privacy practices of these external sites. We encourage you to read their privacy policies.

## 11. CHANGES TO THIS POLICY
We may update this Privacy Policy periodically. We will notify you of material changes through email or prominent website notice. Your continued use of our services constitutes acceptance of the updated policy.

## 12. CONTACT INFORMATION
For questions about this Privacy Policy or to exercise your rights, contact us:

**Email**: [privacy email]
**Address**: [physical address]
**Phone**: [phone number]

**Data Protection Officer**: [if applicable]
**Supervisory Authority**: [if applicable in EU]

---
*This template provides general guidance and should be customized for your specific business and reviewed by qualified legal counsel to ensure compliance with applicable laws.*`
      },
      {
        id: 'terms-of-service-template',
        title: 'Terms of Service Template',
        category: 'Terms & Conditions',
        description: 'Comprehensive terms of service for digital services and products',
        content: `# TERMS OF SERVICE

**Last Updated**: [Date]
**Effective Date**: [Date]

## 1. ACCEPTANCE OF TERMS
By accessing or using [Company Name]'s website, services, or products ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Services.

## 2. DESCRIPTION OF SERVICE
[Company Name] provides [detailed description of your services, products, or platform]. Our Services may include [specific features, tools, or functionalities].

## 3. ELIGIBILITY AND ACCOUNT REGISTRATION

### 3.1 Eligibility
You must be at least 18 years old and have the legal capacity to enter into contracts to use our Services.

### 3.2 Account Requirements
• Provide accurate, current, and complete information
• Maintain and update your account information
• Keep your login credentials secure and confidential
• Notify us immediately of any unauthorized access

### 3.3 Account Responsibility
You are responsible for all activities that occur under your account and for maintaining the security of your account credentials.

## 4. ACCEPTABLE USE POLICY

### 4.1 Permitted Uses
You may use our Services for lawful business and personal purposes in accordance with these Terms.

### 4.2 Prohibited Activities
You may NOT:
• Violate any applicable laws or regulations
• Infringe upon intellectual property rights of others
• Upload or transmit malicious code, viruses, or harmful content
• Attempt to gain unauthorized access to our systems
• Use Services for spam, harassment, or abusive behavior
• Engage in activities that could damage or impair our Services

## 5. INTELLECTUAL PROPERTY

### 5.1 Our Content
All content, features, and functionality of our Services are owned by [Company Name] and protected by copyright, trademark, and other intellectual property laws.

### 5.2 Your Content
You retain ownership of content you submit to our Services. By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, modify, and display your content in connection with providing our Services.

### 5.3 Feedback
Any feedback, suggestions, or improvements you provide become our property and may be used without restriction or compensation.

## 6. PAYMENT TERMS

### 6.1 Fees and Billing
• Service fees are as described on our pricing page
• Payments are due according to your selected billing cycle
• All fees are non-refundable unless otherwise specified
• We reserve the right to change pricing with [notice period] advance notice

### 6.2 Payment Processing
Payments are processed by secure third-party providers. We do not store your complete payment information on our servers.

### 6.3 Late Payment
Accounts with overdue payments may be suspended or terminated. Late fees may apply as permitted by law.

## 7. SERVICE AVAILABILITY AND MODIFICATIONS

### 7.1 Service Availability
We strive to maintain service availability but cannot guarantee uninterrupted access. Scheduled maintenance will be communicated in advance when possible.

### 7.2 Service Modifications
We reserve the right to modify, suspend, or discontinue any aspect of our Services with reasonable notice. We are not liable for any such modifications.

## 8. PRIVACY AND DATA PROTECTION
Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information and is incorporated into these Terms by reference.

## 9. DISCLAIMERS AND LIMITATION OF LIABILITY

### 9.1 Service Disclaimer
Our Services are provided "as is" without warranties of any kind, either express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.

### 9.2 Limitation of Liability
To the maximum extent permitted by law, [Company Name] shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our Services.

### 9.3 Maximum Liability
Our total liability to you for any damages shall not exceed the amount you paid us in the 12 months preceding the claim.

## 10. INDEMNIFICATION
You agree to indemnify and hold harmless [Company Name] from any claims, damages, or expenses arising from your use of our Services, violation of these Terms, or infringement of any rights.

## 11. TERMINATION

### 11.1 Termination by You
You may terminate your account at any time by [termination process].

### 11.2 Termination by Us
We may terminate or suspend your account for violation of these Terms, non-payment, or for any reason with [notice period] advance notice.

### 11.3 Effect of Termination
Upon termination, your right to use our Services ceases immediately. Data deletion will occur according to our retention policies.

## 12. DISPUTE RESOLUTION

### 12.1 Governing Law
These Terms are governed by the laws of [State/Country], without regard to conflict of law principles.

### 12.2 Dispute Resolution Process
Disputes will be resolved through:
1. Good faith negotiation
2. [Mediation/Arbitration if negotiation fails]
3. [Court jurisdiction if applicable]

## 13. GENERAL PROVISIONS

### 13.1 Entire Agreement
These Terms constitute the entire agreement between you and [Company Name] regarding our Services.

### 13.2 Modifications
We may modify these Terms at any time. Material changes will be communicated through email or prominent website notice.

### 13.3 Severability
If any provision of these Terms is found unenforceable, the remaining provisions will remain in full force and effect.

### 13.4 No Waiver
Our failure to enforce any right or provision does not constitute a waiver of such right or provision.

## 14. CONTACT INFORMATION
For questions about these Terms, contact us:

**Email**: [legal email]
**Address**: [physical address]
**Phone**: [phone number]

---
*These Terms of Service are effective as of the date first written above and will remain in effect until modified or terminated in accordance with these Terms.*`
      }
    ];

    return res.status(200).json({
      success: true,
      data: {
        templates: legalTemplates,
        total: legalTemplates.length,
        category: 'Legal Documents'
      }
    });

  } catch (error) {
    console.error('Legal templates error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve legal templates',
      error: error.message
    });
  }
}