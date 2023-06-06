import imp
import logging
import os
import sys
from collections.abc import Generator
from contextlib import contextmanager
from pathlib import Path

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s %(levelname)-10s: %(message)s")
logger = logging.getLogger(__name__)
root_path = Path(__file__).parent


@contextmanager
def cwd(path: Path) -> Generator[None, None, None]:
    old_pwd = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old_pwd)


def main(action: str) -> None:
    match action:
        case "build":
            example_dirs = filter(lambda file: file.is_dir() and "__" not in file.name, root_path.glob("*"))
            for example in example_dirs:
                logger.info(f"Building example {example.name}")
                with cwd(root_path):
                    evaluated_file = imp.load_source(example.name, f"./{example.name}/{example.name}.py")
                app = evaluated_file.app
                logger.info(f"  Building app {app.name}")
                appspec = app.build()
                logger.info(f"  Writing {example.name}/application.json")
                (example / "application.json").write_text(appspec.to_json())


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        main("build")
