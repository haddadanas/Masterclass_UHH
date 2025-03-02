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
    parser.add_argument("--transverse-mass", "-t", action='store_true', default=False, help="Plot Transverse Mass")
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
    def __init__(self, files: dict[str, list[str]], n_bins: int, transverse_mass: bool = False):
        """ Reads the mass data from the files and stores it in a dictionary.
        Args:
            files (dict[str, list[str]]): A dictionary where the keys are the channel names and the values are lists of
                csv file paths containing the mass data.
            n_bins (int): The number of bins to use for the histogram.
            transverse_mass (bool): Whether to read the transverse mass or the invariant mass. Default is False.

        Raises:
            ValueError: If the file format is invalid or if no data is found in the file.
        """
        # instance variables
        self.data = defaultdict(list)
        self.transverse_mass = transverse_mass

        # Read the data from the files
        for channel, file_list in files.items():
            if not file_list:
                continue
            for file in file_list:
                self.data[channel].append(self._read_file(file))
            self.data[channel] = sum(self.data[channel], [])

        # Define the histogram bins
        minimum = min(min(data_array) for data_array in self.data.values())
        maximum = max(max(data_array) for data_array in self.data.values())
        self.bins = [minimum + i * (maximum - minimum) / n_bins for i in range(n_bins + 1)]

    def _read_file(self, file: str) -> list[float]:
        # check file path validity
        if not file.endswith(".csv"):
            raise ValueError(f"Invalid file format: '{file}'")

        # Read the CSV file
        with open(file, 'r') as f:
            lines = f.readlines()
        header = lines[0].strip().split(',')
        mass_label = "Transverse Mass" if self.transverse_mass else "Invariant Mass"
        mass_index = header.index(mass_label)
        data = [float(line.strip().split(',')[mass_index]) for line in lines[1:]]

        # check if data is empty
        if not data:
            raise ValueError(f"No data found in file '{file}'")
        return data

    def items(self) -> tuple[list[str], list[list[float]]]:
        """ Returns the keys and values of the data dictionary as separate lists.
        Returns:
            tuple: A tuple containing two lists:
                - The first list contains the keys of the data dictionary.
                - The second list contains the values of the data dictionary.
        """
        return list(self.data.keys()), list(self.data.values())


def plot_masses(reader: MassReader, stack: bool, output: str, **kwargs):
    """ Plots the masses from the MassReader object.
    Args:
        reader (MassReader): The MassReader object containing the mass data.
        stack (bool): Whether to stack the histograms.
        output (str): The output file path.
        **kwargs: Additional keyword arguments.
    """
    # Set the style
    plt.style.use(hep.style.CMS)
    # initialize the figure and setup axis
    _, ax = plt.subplots(dpi=300, figsize=(10, 10))
    hep.cms.label(data=False, rlabel="Masterclass", ax=ax)
    ax.set_xlabel("Transverse Mass [GeV]" if reader.transverse_mass else "Invariant Mass [GeV]")
    ax.set_ylabel("Events")
    # create a config dict
    hist_kwargs = {
        "bins": reader.bins,
        "stacked": stack,
        "histtype": "stepfilled" if stack else "step",
    }
    # plot the data
    channels, masses = reader.items()
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

    reader = MassReader(files, args.n_bins, args.transverse_mass)
    plot_masses(reader, **args.__dict__)


if __name__ == "__main__":
    main()
