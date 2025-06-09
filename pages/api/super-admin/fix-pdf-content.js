import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('=== FIXING PDF CONTENT IN DATABASE ===');
    
    // Get all company knowledge entries that look like PDFs
    const { data: pdfEntries, error: fetchError } = await supabase
      .from('company_knowledge')
      .select('*')
      .or('title.ilike.%.pdf,content.like.%PDF%');

    if (fetchError) {
      console.error('Error fetching PDF entries:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    console.log(`Found ${pdfEntries.length} potential PDF entries`);

    const results = [];
    
    for (const entry of pdfEntries) {
      try {
        // Check if content looks like raw PDF data
        if (entry.content && entry.content.includes('%PDF-')) {
          console.log(`Fixing PDF content for: ${entry.title}`);
          
          // For now, replace with placeholder content since we don't have the original file
          // In a real scenario, you'd need to re-upload the files
          const placeholderContent = `This is ${entry.title} content. 

[Original PDF content was not properly extracted during upload. Please re-upload this document to get the full text content for AI generation.]

Document Details:
- Title: ${entry.title}
- Type: PDF Document
- Uploaded: ${entry.created_at}
- Company: Parrish Tire (based on tenant_id)

For better AI content generation, please re-upload this PDF file through the super admin dashboard.`;

          const { error: updateError } = await supabase
            .from('company_knowledge')
            .update({ 
              content: placeholderContent,
              document_type: 'pdf_placeholder'
            })
            .eq('id', entry.id);

          if (updateError) {
            console.error(`Error updating entry ${entry.id}:`, updateError);
            results.push({ 
              id: entry.id, 
              title: entry.title, 
              status: 'error', 
              error: updateError.message 
            });
          } else {
            console.log(`Successfully updated: ${entry.title}`);
            results.push({ 
              id: entry.id, 
              title: entry.title, 
              status: 'updated' 
            });
          }
        } else {
          results.push({ 
            id: entry.id, 
            title: entry.title, 
            status: 'skipped', 
            reason: 'Content already appears to be text' 
          });
        }
      } catch (error) {
        console.error(`Error processing entry ${entry.id}:`, error);
        results.push({ 
          id: entry.id, 
          title: entry.title, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${pdfEntries.length} PDF entries`,
      results,
      summary: {
        total: pdfEntries.length,
        updated: results.filter(r => r.status === 'updated').length,
        skipped: results.filter(r => r.status === 'skipped').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    console.error('Fix PDF content error:', error);
    return res.status(500).json({
      message: 'Failed to fix PDF content',
      error: error.message
    });
  }
}