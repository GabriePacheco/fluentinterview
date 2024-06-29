
const Button = ({ children, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r from-[#8C3CD7] to-[#5F44EC] text-white py-2 px-4 rounded ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;