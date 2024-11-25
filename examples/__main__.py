import importlib.util
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
            example_dirs = filter(lambda file: file.is_dir() and "__" not in file.name and file.name != "duplicate_structs", root_path.glob("*"))
            for example in example_dirs:
                if (not (Path(f"{example}/{example.name}.py").exists())):
                    logger.info(f"Couldn't find {example.name}/{example.name}.py; skipping {example}")
                    continue
                logger.info(f"Building example {example.name}")
                with cwd(root_path):
                    spec = importlib.util.spec_from_file_location(example.name, f"./{example.name}/{example.name}.py")
                    if (spec is None):
                        raise Exception(f"Could not find {example.name}.py")
                    else:
                        module = importlib.util.module_from_spec(spec)
                        if spec.loader is not None:
                            spec.loader.exec_module(module)
                app = module.app
                logger.info(f"  Building app {app.name}")
                appspec = app.build()
                logger.info(f"  Writing {example.name}/application.json")
                (example / "application.json").write_text(appspec.to_json())


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1])
    else:
        main("build")
