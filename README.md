# KitchenEye — Mutation Testing

This repository contains the setup and execution scripts for the CS-ST Mutation Testing Assignment, targeting the `stats_service.py` module in the FastAPI backend.

## 🎯 Target Module
- **File:** `backend/services/stats_service.py`
- **Functions Tested:** `_map_category`, `_hygiene_score`, `_pct_change`, `_date_strings_for_range`, `_aggregate_days`.
- **Note:** Firebase dependencies are mocked in `backend/tests/conftest.py` so the test suite can run in isolation without requiring a live database connection or service account keys.

## 🛠 Prerequisites & Setup

Open your terminal (Command Prompt or PowerShell) and navigate to the backend directory. Then activate your Python virtual environment and install the required testing tools.

```bash
cd backend
venv\Scripts\activate

# Install the exact versions used for the assignment
pip install mutmut==2.4.4 pytest pytest-cov
```

## 🧪 1. Running Baseline Tests & Coverage (Task 1)

Before running mutations, ensure the test suite is green and generate the baseline coverage metrics.

```bash
# Run the test suite
pytest tests/test_stats_service.py -v --tb=short

# Generate the HTML coverage report
pytest tests/test_stats_service.py --cov=services.stats_service --cov-report=html:reports/baseline_coverage -v
```
You can view the coverage report by opening `backend/reports/baseline_coverage/index.html` in your browser.

## 👾 2. Running the Mutation Tests (Task 2 & 4)

We use `mutmut` to generate deliberate faults in the code and evaluate if our tests catch them. 

**Important Windows Note:** If you are running this on Windows Command Prompt, you must set the encoding to `utf-8` before running mutmut, otherwise it will crash when trying to print emojis (🎉).

```bash
# Set encoding and run mutmut
cmd /c "set PYTHONIOENCODING=utf-8 && mutmut run"
```

This process generates 365 mutants and takes a few minutes to complete. Once finished, you can view the results in the terminal:

```bash
# View terminal summary
mutmut results
```

## 📊 3. Generating the Mutation HTML Report

To generate the easily-readable HTML report showing exactly which lines survived or were killed:

```bash
# Generate the HTML report
cmd /c "set PYTHONIOENCODING=utf-8 && mutmut html"

# The output will be placed in a folder named 'html'.
# You can copy it to the reports folder to save it:
xcopy /E /I /Y html reports\mutation_final
```
You can view the detailed mutant breakdown by opening `backend/reports/mutation_final/index.html` in your browser.

## 📁 Project Structure Additions

This branch introduces the following files for the assignment:
- `backend/setup.cfg`: Configuration telling mutmut which files to mutate and how to run pytest.
- `backend/tests/conftest.py`: Mocks out Firebase so the pure functions can be tested locally.
- `backend/tests/test_stats_service.py`: Contains the baseline "happy-path" tests, plus the 9 highly-targeted boundary tests required for the assignment.
- `backend/reports/`: Contains the generated HTML evidence for the assignment submission.
