import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ModelViewer from "./components/ModelViewer";

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 flex">
        <div className="flex-1">
          <ModelViewer />
        </div>
        <Sidebar />
      </div>
    </main>
  );
}
