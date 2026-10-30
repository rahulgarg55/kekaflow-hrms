import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KekaFlow — Enterprise HRMS & Payroll Cloud Platform',
  description:
    'Modern unified human resource management platform featuring web check-in, attendance logs, leave approvals, statutory payroll, and employee directory.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%235c3ba2'/><path d='M30 30 L45 50 L30 70 M45 50 L70 30 M45 50 L70 70' stroke='white' stroke-width='10' stroke-linecap='round' stroke-linejoin='round'/></svg>",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-purple-500/20 selection:text-purple-900">
        {children}
      </body>
    </html>
  );
}
