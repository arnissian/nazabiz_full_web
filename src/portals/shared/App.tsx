import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import AppProvider from "./context/AppContext";

export default function App() {
  return (
    <>

      <link href="/assets/css/bootstrap.min.css" rel="stylesheet" type="text/css" id="app-style" />

      <AppProvider><BrowserRouter><ToastContainer/><AppRoutes/></BrowserRouter></AppProvider>
    </>

  );
}