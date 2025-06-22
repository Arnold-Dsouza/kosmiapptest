import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card/50 mobile-safe">
      <div className="container py-6 sm:py-8 text-center text-sm text-muted-foreground px-4">
        <p>&copy; {currentYear} OurScreen. All rights reserved.</p>
        <div className="mt-2 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <span className="hidden sm:inline">•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
