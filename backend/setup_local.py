from argparse import ArgumentParser
from getpass import getpass
from pathlib import Path
from secrets import token_hex, token_urlsafe

from argon2 import PasswordHasher

config = Path(__file__).with_name(".env")


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "--password-file",
        type=Path,
        help="Generate a local password and save it to a new file",
    )
    args = parser.parse_args()
    if config.exists():
        raise SystemExit(
            "backend/.env already exists. Existing settings were preserved."
        )
    password = (
        token_urlsafe(24)
        if args.password_file
        else getpass("Choose the Patterna owner password (at least 12 characters): ")
    )
    if len(password) < 12 or len(password) > 256:
        raise SystemExit("Use 12 to 256 characters.")
    if not args.password_file and password != getpass("Confirm the owner password: "):
        raise SystemExit("Passwords did not match.")
    db_password = token_hex(24)
    if args.password_file:
        with args.password_file.open("x", encoding="utf-8") as file:
            file.write(password)
    with config.open("x", encoding="utf-8") as file:
        file.write(
            f"PATTERNA_DB_PASSWORD={db_password}\n"
            f"PATTERNA_DATABASE_URL=postgresql+psycopg://patterna:{db_password}@127.0.0.1:55432/patterna\n"
            f"PATTERNA_PASSWORD_HASH='{PasswordHasher().hash(password)}'\n"
            "PATTERNA_SECURE_COOKIE=false\n"
        )
    print("Created backend/.env for local use.")


if __name__ == "__main__":
    main()
