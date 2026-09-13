import re
from dataclasses import dataclass


@dataclass(frozen=True)
class PasswordValidation:
    length: bool
    uppercase: bool
    lowercase: bool
    numeric: bool
    special: bool

    @property
    def strong(self) -> bool:
        return all(
            (
                self.length,
                self.uppercase,
                self.lowercase,
                self.numeric,
                self.special,
            )
        )


def validate_password(password: str) -> PasswordValidation:
    return PasswordValidation(
        length=8 <= len(password) < 16,
        uppercase=bool(re.search(r"[A-Z]", password)),
        lowercase=bool(re.search(r"[a-z]", password)),
        numeric=bool(re.search(r"\d", password)),
        special=bool(re.search(r"[^A-Za-z0-9]", password)),
    )