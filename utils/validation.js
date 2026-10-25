// Checks for anything people send us. Each returns an error message,
// or null if the input is fine.

function validateCredentials(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') {
        return 'Username and password must be text.';
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username.trim().toLowerCase())) {
        return 'Username must be 3 to 20 letters, numbers or underscores.';
    }
    if (password.length < 8 || password.length > 72) {
        return 'Password must be 8 to 72 characters.';
    }
    return null;
}

function validateApodDate(date) {
    if (date === undefined) return null; // no date means today
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return 'Date must look like YYYY-MM-DD.';
    }
    // new Date() quietly rolls Feb 30 over to Mar 2, so convert it
    // back to text and check that it did not change
    const parsed = new Date(date + 'T00:00:00Z');
    if (isNaN(parsed) || parsed.toISOString().slice(0, 10) !== date) {
        return 'That is not a real date.';
    }
    if (date < '1995-06-16') {
        return 'The first picture is from 1995-06-16.';
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) {
        return 'That date is in the future.';
    }
    return null;
}

function validateEntry(name, msg) {
    if (typeof name !== 'string' || typeof msg !== 'string') {
        return 'Name and message must be text.';
    }
    if (name.trim().length < 1 || name.trim().length > 40) {
        return 'Name must be 1 to 40 characters.';
    }
    if (msg.trim().length < 1 || msg.trim().length > 280) {
        return 'Message must be 1 to 280 characters.';
    }
    return null;
}

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

module.exports = { validateEntry, validateCredentials, validateApodDate, validateContact };
