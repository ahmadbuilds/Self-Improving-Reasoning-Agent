set -e

echo ""
echo "============================================================"
echo "Starting Self-Improving Reasoning Agent Backend Setup"
echo "============================================================"
echo ""

# Determine paths
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PARENT_DIR="$(dirname "$BACKEND_DIR")"
VENV_DIR="$PARENT_DIR/.venv"

# Step 1: Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "Virtual environment created."
    echo ""
else
    echo "Virtual environment already exists."
    echo ""
fi

# Step 2: Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"
echo "Virtual environment activated."
echo ""

# Step 3: Upgrade pip
echo "Upgrading pip..."
python -m pip install --upgrade pip
echo "pip upgraded."
echo ""

# Step 4: Install dependencies
echo "Installing dependencies from requirements.txt..."
if [ -f "$BACKEND_DIR/requirements.txt" ]; then
    pip install -r "$BACKEND_DIR/requirements.txt"
    echo "Dependencies installed."
    echo ""
else
    echo "Error: requirements.txt not found!"
    exit 1
fi

# Step 5: Success message
echo "============================================================"
echo "Setup complete!"
echo "============================================================"
echo ""
echo "Starting Jupyter Notebook server..."
echo "   The Notebooks folder will open in your browser."
echo ""

# Change to Notebooks directory and start Jupyter
cd "$BACKEND_DIR/Notebooks"
jupyter notebook
