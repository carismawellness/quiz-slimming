const GHL_API_URL     = 'https://services.leadconnectorhq.com';
const GHL_API_KEY     = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = 'imWIWDcnmOfijW0lltPq';

const GHL_CUSTOM_FIELDS = {
    goals          : '8nZxyaAMzd1eKMwv7Aa3', // "What best describes your goal?"
    problemAreas   : '48Iwqxn55gjBfGWqBx7D', // "Which area are you most concerned about?"
    referralSource : 'bqaVYgeCsodjVHdZVMo0', // "Where did you here about us"
    consultation   : '6FZDpYVVy74Qdg2U7U7s', // "Consultation Type"
};

const ghlHeaders = {
    'Authorization': `Bearer ${GHL_API_KEY}`,
    'Version'      : '2021-07-28',
    'Content-Type' : 'application/json',
};

const CORS = {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')   return res.status(405).end('Method Not Allowed');

    try {
        const data = req.body;

        // data[0] goals (array), data[1] problem areas (array),
        // data[2] timeline, data[3] medication, data[4] previous attempts,
        // data[5] referral, data[6] consultation, data[7] contact info
        const goals           = Array.isArray(data[0]) ? data[0].join(', ') : data[0];
        const problemAreas    = Array.isArray(data[1]) ? data[1].join(', ') : data[1];
        const timeline        = data[2];
        const medication      = data[3];
        const prevAttempts    = data[4];
        const referral        = data[5];
        const consultation    = data[6];
        const contactInfo     = data[7];

        const contactPayload = {
            locationId  : GHL_LOCATION_ID,
            firstName   : contactInfo.first_name,
            lastName    : contactInfo.surname,
            email       : contactInfo.email,
            phone       : contactInfo.phone,
            source      : 'Slimming Quiz',
            tags        : [
                'slimming-quiz-lead',
                `timeline:${timeline}`,
                `medication:${medication}`,
                `consultation:${consultation}`,
                `heard-via:${referral}`,
            ],
            customFields: [
                { id: GHL_CUSTOM_FIELDS.goals,          value: goals },
                { id: GHL_CUSTOM_FIELDS.problemAreas,   value: problemAreas },
                { id: GHL_CUSTOM_FIELDS.referralSource, value: referral },
                { id: GHL_CUSTOM_FIELDS.consultation,   value: consultation },
            ],
        };

        // Create or update the contact in a single call. GHL's /contacts/upsert
        // matches on email/phone, so returning leads and re-submissions update the
        // existing record instead of failing with "This location does not allow
        // duplicated contacts" (which the old search-then-create flow did silently).
        const upsert = async (payload) => {
            const r = await fetch(`${GHL_API_URL}/contacts/upsert`, {
                method: 'POST', headers: ghlHeaders, body: JSON.stringify(payload),
            });
            return r.json();
        };

        let result    = await upsert(contactPayload);
        let contactId = result?.contact?.id || null;

        // If the full payload is rejected (e.g. a custom-field issue), still
        // capture the lead's contact details so we never lose a way to reach them.
        if (!contactId) {
            result = await upsert({
                locationId: GHL_LOCATION_ID,
                firstName : contactInfo.first_name,
                lastName  : contactInfo.surname,
                email     : contactInfo.email,
                phone     : contactInfo.phone,
                source    : 'Slimming Quiz',
                tags      : ['slimming-quiz-lead'],
            });
            contactId = result?.contact?.id || null;
        }

        if (!contactId) {
            return res.status(502).json({ error: 'Failed to save contact to GoHighLevel', details: result });
        }

        // Note with full breakdown
        if (contactId) {
            const noteBody = [
                '--- Slimming Quiz Lead ---',
                `Goals: ${goals}`,
                `Problem Areas: ${problemAreas}`,
                `Timeline: ${timeline}`,
                `Open to Medication: ${medication}`,
                `Previous Attempts: ${prevAttempts}`,
                `Where They Heard About Us: ${referral}`,
                `Consultation Type: ${consultation}`,
            ].join('\n');

            await fetch(`${GHL_API_URL}/contacts/${contactId}/notes/`, {
                method: 'POST', headers: ghlHeaders, body: JSON.stringify({ body: noteBody }),
            });
        }

        res.status(200).json({ success: true, contactId });
    } catch (error) {
        res.status(500).json({ error: 'Failed: ' + error.message });
    }
};
