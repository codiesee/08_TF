#!/bin/bash
# Cron job script for weekly data updates
# 
# Add to crontab with: crontab -e
# Then add this line (runs every Sunday at 3am):
#   0 3 * * 0 /path/to/your/TF/api/cron-update.sh >> /var/log/athletics-scraper.log 2>&1
#
# Or run manually:
#   ./cron-update.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Athletics Data Update - $(date)"
echo "=========================================="

# If running via web server
if command -v curl &> /dev/null; then
    # Try localhost first (typical dev setup)
    curl -s "http://localhost/TF/api/scraper.php?update_all=1" || \
    # Fallback to calling PHP directly
    php "$SCRIPT_DIR/scraper.php" update_all=1
else
    php "$SCRIPT_DIR/scraper.php" update_all=1
fi

echo ""
echo "Update complete at $(date)"
