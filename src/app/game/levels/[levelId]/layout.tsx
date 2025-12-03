"use client";

export default function LevelIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute top-0 left-0 w-full h-full z-[1000] bg-white">
      {children}
    </div>
  );
}
