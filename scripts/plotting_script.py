from __future__ import annotations

import argparse
from math import sqrt
from collections import defaultdict
from datetime import datetime
from glob import glob

import matplotlib.pyplot as plt
import mplhep as hep


def parser_setup() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="plotting_script.py", description="Plotting script")
    parser.add_argument("--input", "-i", type=str, help="Input Folder; defaults to './'", default="./")
    parser.add_argument("--output", "-o", type=str, help="Output file with extension; defaults to './*current date*.png'", default=None)
    parser.add_argument(
        "--channel", "-c", type=str, nargs="*", choices=["Higgs", "W", "Z", "all"], default=None,
        help="Channel(s) to plot; defaults to Higgs and Z channels.",
    )
    parser.add_argument("--skip-w-ratio", "-swr", action='store_true', default=False, help="Calculate W+ to W- ratio; default is False")
    parser.add_argument("--min", "-m", type=float, default=10.0, help="minimum value for the histogram; default is 10.0")
    parser.add_argument("--unstack", "-u", action='store_true', default=False, help="Unstack the histograms; default is stacked")
    parser.add_argument("--transverse-mass", "-t", action='store_true', default=False, help="Plot Transverse Mass; default is Invariant Mass")
    parser.add_argument("--n-bins", "-n", type=int, default=20, help="Number of Bins; default is 20")
    return parser


def get_files_by_channel(channels: list[str], input_folder: str) -> dict[str, list[str]]:
    files = {}
    for ch in channels:
        ch_files = glob(f"{input_folder}/{ch}*.csv")
        if not ch_files:
            continue
        files[ch] = ch_files
        print(f"Found {len(ch_files)} files for channel '{ch}'")
    return files


def resolve_channels(channel: str | list | None) -> list[str]:
    if not channel:
        channels = ["Higgs", "Z"]
    elif channel == "all":
        channels = ["Higgs", "W", "Z"]
    else:
        channels = channel if isinstance(channel, list) else [channel]
    if "W" in channels:
        channels.extend(["Wp", "Wm"])
        channels.remove("W")
    return channels


class BaseReader:
    def __init__(self, files: dict[str, list[str]], column: str = "Invariant Mass"):
        if not files:
            error_msg = "No files found for the chosen channels."
            if self.__class__ == WReader:
                error_msg += "\nCannot calculate W+ to W- ratio."
            raise Exception(error_msg)
        self.data: dict[str, list[float]] = defaultdict(list)
        # Read the data from the files
        for channel, file_list in files.items():
            read_files = []
            if not file_list:
                continue
            for file in file_list:
                read_files.append(self._read_file(file, column))
            self.data[channel] = sum(read_files, [])

    def _read_file(self, file: str, mass_label: str) -> list[float]:
        # check file path validity
        if not file.endswith(".csv"):
            raise ValueError(f"Invalid file format: '{file}'")

        # Read the CSV file
        with open(file, 'r') as f:
            lines = f.readlines()
        header = lines[0].strip().split(',')
        mass_index = header.index(mass_label)
        data = [float(line.strip().split(',')[mass_index]) for line in lines[1:]]

        # check if data is empty
        if not data:
            print(f"Skipping '{file}'... No data found in file.")
        return data

    def items(self) -> tuple[list[str], list[list[float]]]:
        """ Returns the keys and values of the data dictionary as separate lists. The keys are modified to match the
        expected channel names.
        Returns:
            tuple: A tuple containing two lists:
                - The first list contains the keys of the data dictionary.
                - The second list contains the values of the data dictionary.
        """
        key_mapping = {"Wp": "W+", "Wm": "W-"}
        keys = list(map(lambda x: key_mapping.get(x, x), self.data.keys()))
        return keys, list(self.data.values())


class MassReader(BaseReader):
    def __init__(self, files: dict[str, list[str]], n_bins: int, x_min: float, transverse_mass: bool = False):
        """ Reads the mass data from the files and stores it in a dictionary.
        Args:
            files (dict[str, list[str]]): A dictionary where the keys are the channel names and the values are lists of
                csv file paths containing the mass data.
            n_bins (int): The number of bins to use for the histogram.
            x_min (float): The minimum value for the histogram.
            transverse_mass (bool): Whether to read the transverse mass or the invariant mass. Default is False.

        Raises:
            ValueError: If the file format is invalid or if no data is found in the file.
        """
        # instance variables
        self.transverse_mass: bool = transverse_mass
        super(MassReader, self).__init__(files, "Transverse Mass" if transverse_mass else "Invariant Mass")

        # Define the histogram bins
        minimum = max(x_min, min(min(data_array) for data_array in self.data.values()))
        maximum = max(max(data_array) for data_array in self.data.values())
        self.bins: list[float] = [minimum + i * (maximum - minimum) / n_bins for i in range(n_bins + 1)]

    def plot_masses(self: MassReader, unstack: bool, output: str, **kwargs):
        """ Plots the masses from the MassReader object.
        Args:
            reader (MassReader): The MassReader object containing the mass data.
            unstack (bool): Whether to unstack the histograms.
            output (str): The output file path.
            **kwargs: Additional keyword arguments.
        """
        # Set the style
        plt.style.use(hep.style.CMS)
        # initialize the figure and setup axis
        _, ax = plt.subplots(dpi=100, figsize=(8, 8))
        hep.cms.label(data=False, rlabel="Masterclass", ax=ax)
        ax.set_xlabel("Transverse Mass [GeV]" if self.transverse_mass else "Invariant Mass [GeV]")
        ax.set_ylabel("Events")
        # create a config dict
        hist_kwargs = {
            "bins": self.bins,
            "stacked": not unstack,
            "histtype": "stepfilled" if not unstack else "step",
        }
        # plot the data
        channels, masses = self.items()
        ax.hist(masses, **hist_kwargs, label=channels)
        # add legend and grid
        ax.legend()
        ax.grid()
        # save the figure
        plt.savefig(output, dpi=300, bbox_inches="tight")
        print(f"Saved plot to '{output}'")
        # show the plot
        plt.show()


class WReader(BaseReader):
    """ Calculates the ratio of W+ to W- events.
    """
    def __init__(self, files: dict[str, list[str]]):

        super(WReader, self).__init__(files)

        self.wp = len(self.data["Wp"])
        self.wm = len(self.data["Wm"])

        if self.wm == 0:
            print("!!!\tNo W- events found. Skipping W+ to W- ratio calculation.")
        else:
            self.w_ratio = self.wp / self.wm
            self.w_error = sqrt(self.w_ratio / self.wm * (1 + self.w_ratio))

    def print_ratio(self):
        print(40 * "*")
        print("***\tCalculating W+ to W- ratio...")
        print(f"***\tFound: {self.wp} W+ events and {self.wm} W- events.")
        print(f"***\tW+ to W- ratio: {self.w_ratio} ± {self.w_error} (stat)")
        print(40 * "*")


def main():
    parser = parser_setup()
    args = parser.parse_args()
    if args.output is None:
        args.output = f"./{datetime.now().strftime('%d%m%Y')}.png"
    # Handle channels
    channels = resolve_channels(args.channel)

    if not args.skip_w_ratio:
        w_files = get_files_by_channel(["Wp", "Wm"], args.input)
        w_reader = WReader(files=w_files)
        w_reader.print_ratio()
        input("Press Enter to continue to the plot...")

    files = get_files_by_channel(channels, args.input)
    reader = MassReader(files=files, n_bins=args.n_bins, x_min=args.min, transverse_mass=args.transverse_mass)
    reader.plot_masses(**args.__dict__)


if __name__ == "__main__":
    main()
