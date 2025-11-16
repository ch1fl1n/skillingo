// Typography.ts
// Centralized font styles for the app

const Typography = {
  display: {
    hero: {
      description: 'Landing pages, large headings',
      fontSize: {
        type: 'dimension',
        value: 48,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 800,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 56,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
  },
  heading: {
    h1: {
      description: 'Page titles',
      fontSize: {
        type: 'dimension',
        value: 32,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 800,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 40,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
    h2: {
      description: 'Section headings',
      fontSize: {
        type: 'dimension',
        value: 32,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 800,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 32,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
    h3: {
      description: 'Subsection headings',
      fontSize: {
        type: 'dimension',
        value: 18,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 800,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 24,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
  },
  body: {
    regular: {
      description: 'Main paragraph text',
      fontSize: {
        type: 'dimension',
        value: 16,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 400,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 24,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
    small: {
      description: 'Secondary paragraphs, helper text',
      fontSize: {
        type: 'dimension',
        value: 14,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 400,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0,
      },
      lineHeight: {
        type: 'dimension',
        value: 20,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
  },
  ui: {
    caption: {
      description: 'Captions, metadata',
      fontSize: {
        type: 'dimension',
        value: 12,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Inter',
      },
      fontWeight: {
        type: 'number',
        value: 400,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0.048,
      },
      lineHeight: {
        type: 'dimension',
        value: 16,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
    button: {
      description: 'Buttons, small actionable labels',
      fontSize: {
        type: 'dimension',
        value: 14,
      },
      textDecoration: {
        type: 'string',
        value: 'none',
      },
      fontFamily: {
        type: 'string',
        value: 'Roboto',
      },
      fontWeight: {
        type: 'number',
        value: 400,
      },
      fontStyle: {
        type: 'string',
        value: 'normal',
      },
      fontStretch: {
        type: 'string',
        value: 'normal',
      },
      letterSpacing: {
        type: 'dimension',
        value: 0.028,
      },
      lineHeight: {
        type: 'dimension',
        value: 16,
      },
      paragraphIndent: {
        type: 'dimension',
        value: 0,
      },
      paragraphSpacing: {
        type: 'dimension',
        value: 0,
      },
      textCase: {
        type: 'string',
        value: 'none',
      },
    },
  },
};

export default Typography;
