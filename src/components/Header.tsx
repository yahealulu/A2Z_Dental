interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  // إظهار "الصفحة الرئيسية" فقط في الصفحة الرئيسية
  const displayTitle = title === 'لوحة التحكم' ? 'الصفحة الرئيسية' : title;

  return (
    <header className="bg-white shadow-card border-b border-gray-100 animate-fade-in h-24">
      <div className="flex items-center justify-center h-full">
        <h1 className="text-3xl font-bold text-black">
          {displayTitle}
        </h1>
      </div>
    </header>
  );
};

export default Header;
