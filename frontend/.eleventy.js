module.exports = function(eleventyConfig) {
  // Ignore the 'src' folder and only include the necessary files
  return {
    dir: {
      input: "src",      // Input folder
      includes: "_includes", // Include folder for layouts/partials
      output: "_site", // Output folder
      layouts: "_includes/layouts"   
    },
    // Optionally, add a passthrough copy to selectively copy assets
    passthroughFileCopy: true, // This is useful for copying static files like images, CSS, etc.
  };
};
  