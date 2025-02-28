import http from "node:http";

http
  .get("http://localhost:5000", (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      // Extract key UI elements
      const titleMatch = data.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : "No title found";

      // Extract navigation items
      const navItems = [];
      const navItemRegex = /<a[^>]*class="[^"]*"[^>]*>(.*?)<\/a>/g;
      let match;
      while ((match = navItemRegex.exec(data)) !== null) {
        navItems.push(match[1].replace(/<[^>]*>/g, "").trim());
      }

      // Extract main content sections
      const sections = [];
      const sectionRegex = /<section[^>]*>(.*?)<\/section>/gs;
      while ((match = sectionRegex.exec(data)) !== null) {
        const headingMatch = match[1].match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/);
        const heading = headingMatch
          ? headingMatch[1].replace(/<[^>]*>/g, "").trim()
          : "Unnamed section";
        sections.push(heading);
      }

      // // // console.log('UI Structure:');
      // // // console.log('=============');
      // // // console.log(`Page Title: ${title}`);
      // // // console.log('\nNavigation Items:');
      navItems.forEach((item) => {
        // // // console.log(`- ${item}`);
      });
      // // // console.log('\nMain Sections:');
      sections.forEach((section) => {
        // // // console.log(`- ${section}`);
      });
    });
  })
  .on("error", (err) => {
    console.error("Error fetching UI:", err.message);
  });
