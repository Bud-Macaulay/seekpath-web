import { useCallback, useEffect, useRef, useState } from "react";
import { createBZVisualizer } from "brillouinzone-visualizer";
import StructureVisualizer from "mc-react-structure-visualizer";
import {
  getBrillouinZoneData,
  getExplicitKPath,
  toCrystalD3,
  toKPOINTS,
} from "matsci-parse";

import {
  formatPath,
  formatSpaceGroupSymbol,
  preparePWText,
  prettify,
} from "../utils";

import { McCopyAccordion, McInfoAccordion } from "mc-react-library";

const DEFAULT_REFERENCE_DISTANCE = 0.025;
const MIN_POINTS_PER_LINE = 2;
const MAX_POINTS_PER_LINE = 100;
const DEFAULT_POINTS_PER_LINE = 40;

const fmt = (x) => x.toFixed(4);

// The primitive cell from seekpath: rows of `lattice` are the cell vectors
// (Å), `positions` are fractional and `types` index the input's elements in
// order of first appearance.
function primitiveCell(
  structure,
  { primitive_lattice, primitive_positions, primitive_types },
) {
  const symbols = [
    ...new Set(structure.sites.map((site) => site.species.symbol)),
  ];
  return {
    lattice: primitive_lattice,
    atoms: primitive_positions.map((frac, i) => ({
      symbol: symbols[primitive_types[i]],
      frac,
      cart: [0, 1, 2].map((j) =>
        frac.reduce((sum, f, k) => sum + f * primitive_lattice[k][j], 0),
      ),
    })),
  };
}

function CoordinatesTable({ title, header, rows }) {
  return (
    <div>
      <h4 className="mb-1 text-xs font-medium text-slate-500">{title}</h4>
      <div className="max-h-64 overflow-auto rounded border border-slate-100">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-100 text-slate-400">
              {header.map((h) => (
                <th key={h} className="px-3 py-1.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, ...values], i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="px-3 py-1 font-mono text-slate-500">{label}</td>
                {values.map((v, j) => (
                  <td key={j} className="px-3 py-1 font-mono text-slate-700">
                    {fmt(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Title laid over the top-left corner of a viewer; clicks pass through.
function ViewerTitle({ children }) {
  return (
    <div className="pointer-events-none absolute left-1 top-1 z-10  bg-white/80 px-2 py-1 text-xs font-semibold ">
      {children}
    </div>
  );
}

function InfoRow({ label, children }) {
  return (
    <>
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </>
  );
}

export default function SeekPath({ structure, className = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [primitive, setPrimitive] = useState(null);
  const [withTimeReversal, setWithTimeReversal] = useState(true);
  const [referenceDistance] = useState(DEFAULT_REFERENCE_DISTANCE);
  const [pointsPerLine, setPointsPerLine] = useState(DEFAULT_POINTS_PER_LINE);
  const [outputsOpen, setOutputsOpen] = useState(null); // useState("vasp") // to open vasp on load
  const [infoOpen, setInfoOpen] = useState(true);
  // Open the structure information again for each new structure (adjusting
  // state during render, see https://react.dev/learn/you-might-not-need-an-effect).
  const [infoStructure, setInfoStructure] = useState(structure);
  if (structure !== infoStructure) {
    setInfoStructure(structure);
    setInfoOpen(true);
  }

  const containerRef = useRef(null);

  const compute = useCallback(
    async (wtr, refDist) => {
      if (!structure) return;
      setLoading(true);
      setError(null);
      setData(null);
      setPrimitive(null);
      try {
        const opts = { withTimeReversal: wtr, referenceDistance: refDist };
        // getBrillouinZoneData drops the primitive cell, so ask seekpath too.
        const [bzData, path] = await Promise.all([
          getBrillouinZoneData(structure, opts),
          getExplicitKPath(structure, opts),
        ]);
        setData(bzData);
        setPrimitive(primitiveCell(structure, path));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [structure],
  );

  useEffect(() => {
    if (!structure) {
      setData(null);
      setError(null);
      return;
    }
    compute(withTimeReversal, referenceDistance);
  }, [structure, compute]);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    const container = containerRef.current;
    const viz = createBZVisualizer(container, data, {
      showPathpoints: false,
      disableInteractOverlay: true,
    });

    return () => {
      window.removeEventListener("resize", viz.resizeRenderer);
      if (container) container.innerHTML = "";
    };
  }, [data]);

  const handleToggleTimeReversal = (e) => {
    const wtr = e.target.checked;
    setWithTimeReversal(wtr);
    compute(wtr, referenceDistance);
  };

  if (!structure) {
    return <></>;
  }

  const pathSummary = data ? formatPath(data.path) : "";

  const vaspKpointsText = data ? toKPOINTS(data.kpath, pointsPerLine) : "";
  const crystalD3Text = data
    ? toCrystalD3(data.kpath, "SeeK-path band path", pointsPerLine)
    : "";
  const pwInputText = data
    ? preparePWText(structure, data.kpath, pointsPerLine)
    : "";

  return (
    <div className={`space-y-3 px-2 sm:px-4 ${className}`}>
      {data && primitive && (
        <>
          <h2 className="text-lg font-semibold text-slate-900">Results</h2>
          <McInfoAccordion
            title="Structure information (primitive cell)"
            open={infoOpen}
            onToggle={() => setInfoOpen(!infoOpen)}
          >
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
                <InfoRow label="Bravais lattice">
                  <span className="font-mono">{data.bravais_lattice}</span>
                </InfoRow>
                <InfoRow label="Extended Bravais symbol">
                  <span className="font-mono">
                    {data.bravais_lattice_extended}
                  </span>{" "}
                  <span className="text-slate-500">
                    ({data.has_inversion_symmetry ? "with" : "without"}{" "}
                    inversion symmetry)
                  </span>
                </InfoRow>
                <InfoRow label="Space group">
                  {formatSpaceGroupSymbol(data.spacegroup_international)}{" "}
                  <span className="text-slate-500">
                    (number {data.spacegroup_number})
                  </span>
                </InfoRow>
              </dl>

              <CoordinatesTable
                title="Primitive cell vectors (Å)"
                header={["", "x", "y", "z"]}
                rows={primitive.lattice.map((v, i) => [`v${i + 1}`, ...v])}
              />
              <div className="grid gap-3 lg:grid-cols-2">
                <CoordinatesTable
                  title="Atom coordinates (fractional)"
                  header={["Element", "r1", "r2", "r3"]}
                  rows={primitive.atoms.map((a) => [a.symbol, ...a.frac])}
                />
                <CoordinatesTable
                  title="Atom coordinates (Cartesian, Å)"
                  header={["Element", "x", "y", "z"]}
                  rows={primitive.atoms.map((a) => [a.symbol, ...a.cart])}
                />
              </div>
            </div>
          </McInfoAccordion>
        </>
      )}
      {data && (
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="relative overflow-hidden">
            <ViewerTitle>Brillouin zone</ViewerTitle>
            <div
              ref={containerRef}
              className="h-[480px] w-full overflow-hidden"
            />
          </div>

          <div className="relative overflow-hidden">
            <ViewerTitle>Structure (primitive)</ViewerTitle>
            {structure && (
              <div className="h-[480px] w-full">
                <StructureVisualizer structure={structure} />
              </div>
            )}
          </div>
        </div>
      )}
      {data && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            High-symmetry k-points
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="px-3 py-1.5 font-medium">Label</th>
                <th className="px-3 py-1.5 font-medium">Rel. coords</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.kpoints_rel).map(([label, coords]) => (
                <tr key={label} className="border-b border-slate-50">
                  <td className="px-3 py-1.5 font-mono">{prettify(label)}</td>
                  <td className="px-3 py-1.5 font-mono text-slate-700">
                    {coords.map((c) => c.toFixed(4)).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <>
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <InfoRow label="Recommended path">
              <span className="font-mono">{pathSummary}</span>
              {data.augmented_path && (
                <span className="ml-1.5 inline-flex items-center rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                  augmented
                </span>
              )}
            </InfoRow>
            <InfoRow label="Time reversal">
              {/* With an inversion centre k and -k are already equivalent, so
                  time reversal cannot change the path. */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <label
                  className={`inline-flex select-none items-center gap-1.5 ${
                    data.has_inversion_symmetry
                      ? "cursor-not-allowed text-slate-400"
                      : "cursor-pointer"
                  }`}
                  title="When off, and the structure has no inversion symmetry, the path is augmented with -k segments (HPKOT)"
                >
                  <input
                    type="checkbox"
                    checked={withTimeReversal}
                    onChange={handleToggleTimeReversal}
                    disabled={data.has_inversion_symmetry}
                    className="accent-blue-600"
                  />
                  <span>Assume time-reversal symmetry</span>
                </label>
                {data.has_inversion_symmetry && (
                  <span className="text-xs text-slate-500">
                    (structure has an inversion centre, so the path is
                    unaffected)
                  </span>
                )}
              </div>
            </InfoRow>
            <InfoRow label="Points per line">
              <label className="flex select-none items-center gap-2">
                <input
                  type="range"
                  min={MIN_POINTS_PER_LINE}
                  max={MAX_POINTS_PER_LINE}
                  step={1}
                  value={pointsPerLine}
                  onChange={(e) =>
                    setPointsPerLine(parseInt(e.target.value, 10) || 0)
                  }
                  aria-label="Points per line"
                  className="w-48 accent-blue-600"
                />
                <span className="w-12 font-mono">{pointsPerLine}</span>
              </label>
            </InfoRow>
          </dl>
          <McCopyAccordion
            title="KPOINTS (VASP)"
            text={vaspKpointsText}
            filename="KPOINTS"
            open={outputsOpen === "vasp"}
            onToggle={() =>
              setOutputsOpen((prev) => (prev === "vasp" ? null : "vasp"))
            }
          />
          <McCopyAccordion
            title="Quantum ESPRESSO pw.x input"
            text={pwInputText}
            filename="PW.in"
            open={outputsOpen === "pw"}
            onToggle={() =>
              setOutputsOpen((prev) => (prev === "pw" ? null : "pw"))
            }
          />
          <McCopyAccordion
            title="CRYSTAL D3 BAND"
            text={crystalD3Text}
            filename="BAND"
            open={outputsOpen === "d3"}
            onToggle={() =>
              setOutputsOpen((prev) => (prev === "d3" ? null : "d3"))
            }
          />
        </>
      )}

      {/* loading and error states here */}
      {loading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-500">
          Computing high-symmetry k-path…
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-6 text-sm text-red-600">
          Failed to compute the Brillouin zone: {error}
        </div>
      )}
    </div>
  );
}
