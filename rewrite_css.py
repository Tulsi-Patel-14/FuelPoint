import re

with open(r'd:\FuelStationAdmin\src\styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace --font-sans and --font-display
css = re.sub(r'--font-sans: "[^"]+".*?;', '--font-sans: "Lato", ui-sans-serif, system-ui, sans-serif;', css)
css = re.sub(r'--font-display: "[^"]+".*?;', '--font-display: "Lato", ui-sans-serif, system-ui, sans-serif;', css)

# We will just write a new CSS file entirely since we are fundamentally changing the theme colors.
new_css = """@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-2xl: 28px;
  --radius-3xl: 28px;
  --font-sans: "Lato", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Lato", ui-sans-serif, system-ui, sans-serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-navy: var(--navy);
  --color-navy-foreground: var(--navy-foreground);
  --color-teal: var(--teal);
  --color-teal-foreground: var(--teal-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ring-offset-background: var(--background);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --shadow-card: 0 1px 2px #CCCCCC, 0 8px 24px -12px #CCCCCC;
  --shadow-elevated: 0 2px 4px #CCCCCC, 0 18px 40px -16px #CCCCCC;
}

:root {
  --radius: 8px;
  --background: #FFFFFF;
  --foreground: #6D6E71;
  --card: #FFFFFF;
  --card-foreground: #6D6E71;
  --popover: #FFFFFF;
  --popover-foreground: #6D6E71;
  --primary: #14C7A3;
  --primary-foreground: #6D6E71;
  --secondary: #F5F7FA;
  --secondary-foreground: #6D6E71;
  --muted: #F5F7FA;
  --muted-foreground: #6D6E71;
  --accent: #F5F7FA;
  --accent-foreground: #6D6E71;
  --destructive: oklch(0.634 0.082 76.0);
  --destructive-foreground: #FFFFFF;
  --success: #14C7A3;
  --success-foreground: #FFFFFF;
  --warning: oklch(0.748 0.127 103.7);
  --warning-foreground: #6D6E71;
  --navy: #0B1F2A;
  --navy-foreground: #FFFFFF;
  --teal: #14C7A3;
  --teal-foreground: #6D6E71;
  --border: #E5E7EB;
  --input: #FFFFFF;
  --ring: #14C7A3;
  --chart-1: #14C7A3;
  --chart-2: #1F8FB8;
  --chart-3: #6D6E71;
  --chart-4: #0B1F2A;
  --chart-5: #CCCCCC;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #6D6E71;
  --sidebar-primary: #14C7A3;
  --sidebar-primary-foreground: #6D6E71;
  --sidebar-accent: #F5F7FA;
  --sidebar-accent-foreground: #14C7A3;
  --sidebar-border: #E5E7EB;
  --sidebar-ring: #14C7A3;
}

.dark {
  --background: #0B1F2A;
  --foreground: #F5F7FA;
  --card: #0B1F2A;
  --card-foreground: #F5F7FA;
  --popover: #0B1F2A;
  --popover-foreground: #F5F7FA;
  --primary: #14C7A3;
  --primary-foreground: #0B1F2A;
  --secondary: #1F8FB8;
  --secondary-foreground: #F5F7FA;
  --muted: #6D6E71;
  --muted-foreground: #CCCCCC;
  --accent: #1F8FB8;
  --accent-foreground: #FFFFFF;
  --destructive: oklch(0.634 0.082 76.0);
  --destructive-foreground: #FFFFFF;
  --border: #6D6E71;
  --input: #0B1F2A;
  --ring: #14C7A3;
  --sidebar: #0B1F2A;
  --sidebar-foreground: #F5F7FA;
  --sidebar-primary: #14C7A3;
  --sidebar-primary-foreground: #0B1F2A;
  --sidebar-accent: #1F8FB8;
  --sidebar-accent-foreground: #FFFFFF;
  --sidebar-border: #6D6E71;
  --sidebar-ring: #14C7A3;
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3,
  h4 {
    letter-spacing: -0.02em;
  }
}

@utility surface-card {
  background-color: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
}

@utility gradient-navy {
  background-image: linear-gradient(
    145deg,
    var(--color-navy) 0%,
    oklch(0.28 0.04 276.8) 55%,
    oklch(0.33 0.05 276.8) 100%
  );
}

@utility gradient-brand {
  background-image: linear-gradient(
    120deg,
    var(--color-primary) 0%,
    var(--color-teal) 100%
  );
}

@utility scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
  }
}
"""

with open(r'd:\FuelStationAdmin\src\styles.css', 'w', encoding='utf-8') as f:
    f.write(new_css)

print("styles.css updated")
