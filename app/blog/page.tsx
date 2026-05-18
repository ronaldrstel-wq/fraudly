import { permanentRedirect } from "next/navigation";

/** Legacy /blog index → canonical Fraudly Intelligence hub. */
export default function BlogIndexRedirect() {
  permanentRedirect("/intelligence");
}
