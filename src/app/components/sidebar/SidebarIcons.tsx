import { FiSun, FiBox, FiSettings } from "react-icons/fi";

interface SidebarIconsProps {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
}

const SidebarIcons = ({
  selectedOption,
  setSelectedOption,
}: SidebarIconsProps) => {
  return (
    <div className="w-full md:w-fit border-b md:border-b-0 md:border-r h-12 md:h-full flex flex-row items-center md:flex-col gap-4 p-2 md:py-4">
      <button
        onClick={() => setSelectedOption("lighting")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "lighting" ? "bg-gray-100" : ""
        }`}
      >
        <FiSun size={25} />
      </button>
      <button
        onClick={() => setSelectedOption("material")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "material" ? "bg-gray-100" : ""
        }`}
      >
        <FiBox size={25} />
      </button>
      <button
        onClick={() => setSelectedOption("render")}
        className={`p-2 hover:bg-gray-100 ${
          selectedOption === "render" ? "bg-gray-100" : ""
        }`}
      >
        <FiSettings size={25} />
      </button>
    </div>
  );
};

export default SidebarIcons;
