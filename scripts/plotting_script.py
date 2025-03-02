import argparse
from glob import glob
from collections import defaultdict

import matplotlib.pyplot as plt
import mplhep as hep  # type: ignore


def parser_setup():
    parser = argparse.ArgumentParser(description="Plotting script")
    parser.add_argument("--input", "-i", type=str, help="Input Folder", default="./")
    parser.add_argument("--output", "-o", type=str, help="Output file", default="./output.pdf")
    parser.add_argument(
        "--channel", "-c", type=str, choices=["all", "Higgs", "W-Boson", "Z-Boson", "Zoo"], default="all",
    )
    parser.add_argument("--stack", "-s", action='store_true', default=False, help="Stack the histograms")
    parser.add_argument("--n-bins", "-n", type=int, default=20, help="Number of Bins")
    return parser


def get_files_by_channel(channel: str, input_folder: str) -> dict[str, list[str]]:
    channels = ["Higgs", "W-Boson", "Z-Boson", "Zoo"] if channel == "all" else [channel]
    files = {}
    for ch in channels:
        ch_files = glob(f"{input_folder}/{ch}*.csv")
        if not ch_files:
            continue
        files[ch] = ch_files
        print(f"Found {len(ch_files)} files for channel '{ch}'")
    return files


class MassReader:
    def __init__(self, files: dict[str, list[str]], n_bins: int):
        # Read the CSV files
        self.data = defaultdict(list)
        minimum = 1000
        maximum = 0
        for channel, file_list in files.items():
            if not file_list:
                continue
            for file in file_list:
                self.data[channel].append(self.read_file(file))
            self.data[channel] = sum(self.data[channel], [])
            minimum = min(minimum, min(self.data[channel]))
            maximum = max(maximum, max(self.data[channel]))
        self.bins = [minimum + i * (maximum - minimum) / n_bins for i in range(n_bins + 1)]

    def read_file(self, file: str):
        # Read the CSV file
        with open(file, 'r') as f:
            lines = f.readlines()
        header = lines[0].strip().split(',')
        mass_index = header.index("Invariant Mass")
        data = [float(line.strip().split(',')[mass_index]) for line in lines[1:]]
        return data


def plot_masses(data: dict[str, list[float]], bins: list[float], stack: bool, output: str, **kwargs):
    # Set the style
    plt.style.use(hep.style.CMS)
    # initialize the figure and setup axis
    fig, ax = plt.subplots(dpi=300, figsize=(10, 10))
    hep.cms.label(data=False, rlabel="Masterclass", ax=ax)
    ax.set_xlabel("Invariant Mass [GeV]")
    ax.set_ylabel("Events")
    # create a config dict
    hist_kwargs = {
        "bins": bins,
        "stacked": stack,
        "histtype": "stepfilled" if stack else "step",
    }
    # plot the data
    masses = list(data.values())
    channels = list(data.keys())
    ax.hist(masses, **hist_kwargs, label=channels)
    # add legend and grid
    ax.legend()
    ax.grid()
    # save the figure
    plt.savefig(output, dpi=300, bbox_inches="tight")
    print(f"Saved plot to '{output}'")
    # show the plot
    plt.show()


def main():
    parser = parser_setup()
    args = parser.parse_args()
    files = get_files_by_channel(args.channel, args.input)
    if not files:
        raise Exception(f"No files found for channel '{args.channel}' in folder '{args.input}'")

    reader = MassReader(files, args.n_bins)
    plot_masses(reader.data, reader.bins, **args.__dict__)


if __name__ == "__main__":
    main()
