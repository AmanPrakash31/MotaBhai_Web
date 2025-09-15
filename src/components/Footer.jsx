
export default function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto py-8 px-4 text-center text-sm text-muted-foreground">
        <div className="mb-4">
            <h3 className="font-bold text-lg text-foreground mb-2">Mota Bhai Automobiles</h3>
            <p>NH28 Near Housing Board Office, Muzaffarpur, Bihar-843108</p>
            <p>Mobile: 8092155018, 7858923003</p>
            <p>Email: motabhaiautomobile@gmail.com</p>
        </div>
        <div className="border-t my-4"></div>
        <p className="font-semibold text-base text-destructive mb-2">Currently dealing only in Bihar.</p>
        <p>© {new Date().getFullYear()} Mota Bhai Automobiles. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
