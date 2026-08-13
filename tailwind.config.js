/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        his: {
          sidebar: '#244B78',      // Tone Sidebar dịu mắt, bớt nặng nề
          sidebarDark: '#1B3B60',
          sidebarActive: '#0A6EBD',
          primary: '#0A6EBD',      // Primary Blue chuẩn HIS duy nhất
          primaryHover: '#085896',
          primaryLight: '#EBF4FC',
          bg: '#F5F7FA',           // Nền xám nhạt trung tính
          border: '#D8DEE6',       // Đường viền bảng phân tách sắc nét
          textMain: '#1A2A3A',
          textSub: '#5A6E82',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs':   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '2xs':  '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        '3xs':  '0 1px 1px 0 rgb(0 0 0 / 0.02)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
