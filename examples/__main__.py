import logging
import pathlib
import subprocess
from itertools import chain, product
from pathlib import Path

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)-10s: %(message)s")
logger = logging.getLogger(__name__)
root_path = Path(__file__).parent


def main() -> None:
    smart_contracts = pathlib.Path(__file__).parent / "smart_contracts"
    artifacts = smart_contracts / "artifacts"
    output_options = {
        "arc32": ["--output-arc32", "--no-output-arc56"],
        "arc56": ["--output-arc56", "--no-output-arc32"],
    }
    arc32_apps = [
        "duplicate_structs",
        "hello_world",
        "life_cycle",
        "minimal",
        "state",
        "voting_round",
    ]
    arc56_apps = [
        "structs",
        "nested",
    ]

    for app, options in chain(
        product(arc32_apps, [output_options["arc32"]]), product(arc56_apps, [output_options["arc56"]])
    ):
        app_path = smart_contracts / app / "contract.py"
        app_artifacts = artifacts / app
        try:
            subprocess.run(
                [
                    "algokit",
                    "--no-color",
                    "compile",
                    "python",
                    app_path.absolute(),
                    f"--out-dir={app_artifacts}",
                    "--no-output-teal",
                    "--no-output-source-map",
                ]
                + options,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                check=True,
            )
        except Exception as e:
            print(f"Error compiling contract for app {app}: {e}")


if __name__ == "__main__":
    main()
