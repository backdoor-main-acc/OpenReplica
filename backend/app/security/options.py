from app.security.analyzer import SecurityAnalyzer
from app.security.invariant.analyzer import InvariantAnalyzer

SecurityAnalyzers: dict[str, type[SecurityAnalyzer]] = {
    'invariant': InvariantAnalyzer,
}
