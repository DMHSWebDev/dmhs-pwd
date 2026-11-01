// Checks for anything people send us. Each returns an error message,
// or null if the input is fine.

const ORG_TYPES = ['Small business', 'Nonprofit', 'Club or team', 'School group', 'Individual', 'Other'];
const TIERS = ['Showcase', 'Storyteller', 'Storefront', 'Not sure yet'];

// A website request. Name, email and the project description are required;
// everything else is optional but must still be sensible if it is sent.
function validateContact({ name, email, organization, orgType, tier, currentSite, message }) {
    for (const value of [name, email, message]) {
        if (typeof value !== 'string') return 'Name, email and project details are required.';
    }
    for (const value of [organization, orgType, tier, currentSite]) {
        if (value !== undefined && typeof value !== 'string') return 'Every field must be text.';
    }
    if (name.trim().length < 1 || name.trim().length > 80) {
        return 'Name must be 1 to 80 characters.';
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address.';
    }
    if (organization && organization.trim().length > 120) {
        return 'Organization name must be 120 characters or fewer.';
    }
    if (orgType && !ORG_TYPES.includes(orgType)) {
        return 'Please pick an organization type from the list.';
    }
    if (tier && !TIERS.includes(tier)) {
        return 'Please pick a package from the list.';
    }
    if (currentSite && (currentSite.trim().length > 200 || !/^https?:\/\/\S+$/.test(currentSite.trim()))) {
        return 'Current website should be a full address, like https://example.com.';
    }
    if (message.trim().length < 20 || message.trim().length > 2000) {
        return 'Project details must be 20 to 2000 characters.';
    }
    return null;
}

module.exports = { validateContact };
