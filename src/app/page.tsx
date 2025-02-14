import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ModelViewer from "./components/ModelViewer";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row">
        {" "}
        {/* Changed to column by default, row on md screens */}
        <div className="h-fit md:h-full w-full md:w-3/4">
          <ModelViewer />
        </div>
        <Sidebar />
      </div>
    </main>
  );
}
