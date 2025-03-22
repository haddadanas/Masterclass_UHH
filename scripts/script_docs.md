## Documentation

### Overview
This script is designed to process mass data from CSV files and generate plots for different physics channels (e.g., Higgs, W+, W-, Z). It supports both invariant and transverse mass plotting, with options for stacked or unstacked histograms.
The calculated W+ to W- ratio is displayed in the terminal output and the generated plot is by default saved as `output.png` in the current directory.

### Command-Line Arguments
| Argument               | Short | Type    | Default         | Description                                                                 |
|------------------------|-------|---------|-----------------|-----------------------------------------------------------------------------|
| `--input`             | `-i`  | `str`   | `./`            | Input folder containing CSV files.                                         |
| `--output`            | `-o`  | `str`   | `./output.png`  | Output file path for the generated plot.                                   |
| `--channel`           | `-c`  | `list`  | `all`           | Channels to plot (`Higgs`, `W`, `Z`). Defaults to all channels.            |
| `--min`               | `-m`  | `float` | `10.0`          | Minimum value for the histogram.                                           |
| `--unstack`           | `-u`  | `bool`  | `False`         | If set, unstack the histograms. Default is stacked.                        |
| `--transverse-mass`   | `-t`  | `bool`  | `False`         | If set, plot transverse mass instead of invariant mass.                    |
| `--n-bins`            | `-n`  | `int`   | `20`            | Number of bins for the histogram.                                          |


## Tutorial

### Prerequisites
1. Ensure you have Python installed (version 3.7 or higher recommended).
2. Install the required libraries:
   ```bash
   pip install matplotlib mplhep
   ```

### Example Usage

1. **Specify Input Folder**
   To use a specific folder containing CSV files:
   ```bash
   python plotting_script.py --input /path/to/csv_folder
   ```

2. **Filter by Channel**
   To plot only the Higgs channel:
   ```bash
   python plotting_script.py --channel Higgs
   ```
   For multiple channels give the channel names separated by spaces.
   E.g. to plot only the Higgs and Z channels:
   ```bash
   python plotting_script.py --channel Higgs Z
   ```

3. **Customize Histogram**
   - Set the minimum value for the histogram:
     ```bash
     python plotting_script.py --min 20.0
     ```
   - Use 50 bins for the histogram:
     ```bash
     python plotting_script.py --n-bins 50
     ```

4. **Unstack Histograms**
   To generate unstacked histograms:
   ```bash
   python plotting_script.py --unstack
   ```

6. **Plot Transverse Mass**
   To plot transverse mass instead of invariant mass:
   ```bash
   python plotting_script.py --transverse-mass
   ```

7. **Save to Custom Output**
   To save the plot to a specific file:
   ```bash
   python plotting_script.py --output /path/to/output.png
   ```
   Extension can also be changed to `.jpg`, `.pdf`, etc.