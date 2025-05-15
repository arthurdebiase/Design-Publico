// Asset Headers Plugin for Netlify
// This plugin ensures assets are served with correct content types

module.exports = {
  onPostBuild: async ({ constants, utils }) => {
    const fs = require('fs');
    const path = require('path');

    console.log('Adding asset headers for CSS and JavaScript files...');

    // Get the publish directory
    const publishDir = constants.PUBLISH_DIR;
    const headersPath = path.join(publishDir, '_headers');

    // Make sure we have current headers
    let headers = '';
    try {
      if (fs.existsSync(headersPath)) {
        headers = fs.readFileSync(headersPath, 'utf8');
      }
    } catch (error) {
      console.error('Error reading existing _headers:', error);
    }

    // Add headers for CSS files
    headers += '\n\n# CSS Files\n';
    headers += '*.css\n';
    headers += '  Content-Type: text/css\n';

    // Add headers for JS files
    headers += '\n\n# JavaScript Files\n';
    headers += '*.js\n';
    headers += '  Content-Type: application/javascript\n';

    // Write updated headers file
    try {
      fs.writeFileSync(headersPath, headers);
      console.log('Successfully updated _headers file with content type headers');
    } catch (error) {
      console.error('Error writing _headers file:', error);
    }
  }
};