import BlindUI from "../../components/BlindUI";
import LowVisionUI from "../../components/LowVisionUI";
import { useMainActions } from "../../hooks/useMainActions";

export default function Main() {
  const mode = localStorage.getItem("accessMode");
  const actions = useMainActions();

  if (mode === "low-vision") {
    return <LowVisionUI {...actions} />;
  }

  return <BlindUI {...actions} />;
}
