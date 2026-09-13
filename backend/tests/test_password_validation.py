from app.password_validation import validate_password


def test_strong_password_meets_all_requirements():
    result = validate_password("Strong1!")
    assert result.strong is True


def test_password_must_be_at_least_8_characters():
    result = validate_password("Ab1!xyz")
    assert result.strong is False


def test_password_must_be_less_than_16_characters():
    result = validate_password("StrongPassword1!")
    assert result.strong is False


def test_password_requires_uppercase():
    result = validate_password("strong1!")
    assert result.strong is False


def test_password_requires_lowercase():
    result = validate_password("STRONG1!")
    assert result.strong is False


def test_password_requires_numeric():
    result = validate_password("Strong!!")
    assert result.strong is False


def test_password_requires_special_character():
    result = validate_password("Strong123")
    assert result.strong is False