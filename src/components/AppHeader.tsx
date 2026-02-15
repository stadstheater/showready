import logo from "@/assets/logo-stadstheater-wit.png";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container flex h-16 items-center">
        <img src={logo} alt="Stadstheater Zoetermeer" className="h-8" />
      </div>
    </header>
  );
}
