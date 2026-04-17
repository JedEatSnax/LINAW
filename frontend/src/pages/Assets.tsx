import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";

import Sidebar from "../components/sidebar";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

export function Assets() {
  const [open, setOpen] = useState(false);

  return (
    <main className="h-screen overflow-hidden flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 p-6 overflow-y-auto">
          <h1 className="font-ibm-mono text-amber-400">Assets</h1>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <Button variant="contained" onClick={() => setOpen(true)}>
            Open modal
          </Button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            aria-labelledby="parent-modal-title"
            aria-describedby="parent-modal-description"
          >
            <Box sx={style}>
              <h2 id="parent-modal-title">Text in a modal</h2>
              <p id="parent-modal-description">
                Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
              </p>
            </Box>
          </Modal>
        </div>
      </div>
    </main>
  );
}

export default Assets;
