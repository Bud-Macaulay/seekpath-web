import { McStructureUpload } from "mc-react-library";

import { examples } from "./examples";

const EXAMPLES = examples.map((example) => ({
  ...example,
  fileName: `${example.symbol}_POSCAR`,
}));

export default function CrystalStructureUpload(props) {
  return (
    <McStructureUpload
      historyKey="seekpath.parsedStructures"
      historyTitle="Previously calculated structures"
      examples={EXAMPLES}
      {...props}
    />
  );
}
