// Shared footer for every page. Each page only needs an empty
// <footer class="site-footer" id="site-footer"></footer> and this script.

const DISTRICT = 'https://www.worcesterschools.org';

// School social accounts, run by Doherty's CVE Marketing program.
const INSTAGRAM = 'https://www.instagram.com/doherty_highlanders/';
const FACEBOOK = 'https://www.facebook.com/p/Doherty-Memorial-High-School-61552491896966/';

// No user data goes in here, so innerHTML is safe
document.querySelector('#site-footer').innerHTML = `
    <div class="footer-inner">
        <div class="footer-about">
            <p class="footer-name">DMHS Programming &amp; Web Development</p>
            <p>
                A state-approved Chapter&nbsp;74 Career &amp; Technical Education program at
                Doherty Memorial High School, part of Worcester Public Schools in
                Worcester, Massachusetts.
            </p>
        </div>

        <nav class="footer-col" aria-label="Site">
            <p class="footer-head">This site</p>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/#about">About the program</a></li>
                <li><a href="/#services">Free web services</a></li>
                <li><a href="/request">Request a website</a></li>
                <li><a href="/news">News</a></li>
                <li><a href="/projects">Student projects</a></li>
            </ul>
        </nav>

        <nav class="footer-col" aria-label="School and district">
            <p class="footer-head">School &amp; district</p>
            <ul>
                <li><a href="${DISTRICT}/o/dmhs/page/engineering-and-technology-academy-eta-copy-copy-copy/">Programming &amp; Web Development at Doherty</a></li>
                <li><a href="${DISTRICT}/o/dmhs/page/doherty-highs-chapter-74-cte-programs/">Doherty&rsquo;s Chapter 74 CTE programs</a></li>
                <li><a href="${DISTRICT}/o/dmhs">Doherty Memorial High School</a></li>
                <li><a href="${DISTRICT}/">Worcester Public Schools</a></li>
                <li><a href="https://www.doe.mass.edu/ccte/frameworks/program/web-development/default.html">State framework (MA DESE)</a></li>
            </ul>
        </nav>

        <nav class="footer-col" aria-label="Doherty social media">
            <p class="footer-head">Follow Doherty</p>
            <ul>
                <li><a href="${INSTAGRAM}">Instagram &middot; @doherty_highlanders</a></li>
                <li><a href="${FACEBOOK}">Facebook &middot; Doherty Memorial High School</a></li>
            </ul>
            <p class="footer-note">Run by Doherty&rsquo;s CVE Marketing program.</p>
        </nav>
    </div>
    <p class="footer-legal">&copy; ${new Date().getFullYear()} Doherty Memorial High School &middot; Worcester Public Schools</p>
`;
