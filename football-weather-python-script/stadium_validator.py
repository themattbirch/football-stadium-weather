import json
import logging
from typing import Dict, List, Tuple
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class StadiumValidator:
    def __init__(self, json_file: str = 'stadium_coordinates.json'):
        self.json_file = json_file
        self.required_fields = ['location', 'team', 'latitude', 'longitude']
        
    def validate(self) -> Tuple[bool, List[str]]:
        """Validate the stadium JSON data"""
        errors = []
        try:
            # Check if file exists
            if not Path(self.json_file).exists():
                return False, [f"File not found: {self.json_file}"]
            
            # Load JSON data
            with open(self.json_file, 'r') as f:
                data = json.load(f)
            
            # Validate structure
            if not isinstance(data, dict):
                errors.append("Invalid JSON structure: root must be an object")
                return False, errors
            
            if 'nfl' not in data or 'ncaa' not in data:
                errors.append("Missing required sections: 'nfl' and 'ncaa'")
                return False, errors
            
            # Validate NFL stadiums
            nfl_errors = self._validate_section(data['nfl'], 'NFL')
            errors.extend(nfl_errors)
            
            # Validate NCAA stadiums
            ncaa_errors = self._validate_section(data['ncaa'], 'NCAA')
            errors.extend(ncaa_errors)
            
            # Check expected counts
            if len(data['nfl']) < 30:
                errors.append(f"Too few NFL stadiums: found {len(data['nfl'])}, expected at least 30")
            if len(data['ncaa']) < 100:
                errors.append(f"Too few NCAA stadiums: found {len(data['ncaa'])}, expected at least 100")
            
            # Print summary
            logging.info(f"Validation complete:")
            logging.info(f"NFL stadiums: {len(data['nfl'])}")
            logging.info(f"NCAA stadiums: {len(data['ncaa'])}")
            
            return len(errors) == 0, errors
            
        except Exception as e:
            return False, [f"Error validating JSON: {str(e)}"]
    
    def _validate_section(self, section: Dict, section_name: str) -> List[str]:
        """Validate a section of stadium data"""
        errors = []
        
        for stadium_name, stadium_data in section.items():
            # Check required fields
            for field in self.required_fields:
                if field not in stadium_data:
                    errors.append(f"{section_name} stadium '{stadium_name}' missing required field: {field}")
                    continue
            
            # Validate coordinates
            if 'latitude' in stadium_data and 'longitude' in stadium_data:
                try:
                    lat = float(stadium_data['latitude'])
                    lon = float(stadium_data['longitude'])
                    
                    # Basic coordinate validation
                    if not (-90 <= lat <= 90):
                        errors.append(f"{section_name} stadium '{stadium_name}' has invalid latitude: {lat}")
                    if not (-180 <= lon <= 180):
                        errors.append(f"{section_name} stadium '{stadium_name}' has invalid longitude: {lon}")
                        
                    # US-specific coordinate validation
                    if not self._is_in_us_bounds(lat, lon):
                        errors.append(f"{section_name} stadium '{stadium_name}' coordinates outside US bounds: {lat}, {lon}")
                        
                except ValueError:
                    errors.append(f"{section_name} stadium '{stadium_name}' has invalid coordinate format")
        
        return errors
    
    def _is_in_us_bounds(self, lat: float, lon: float) -> bool:
        """Check if coordinates are within US bounds (including Alaska and Hawaii)"""
        BOUNDS = {
            'continental': {
                'lat': (24.7, 49.4),
                'lon': (-125.0, -66.9)
            },
            'alaska': {
                'lat': (51.0, 71.5),
                'lon': (-180.0, -130.0)
            },
            'hawaii': {
                'lat': (18.7, 22.5),
                'lon': (-160.3, -154.5)
            }
        }
        
        for region in BOUNDS.values():
            if (region['lat'][0] <= lat <= region['lat'][1] and
                region['lon'][0] <= lon <= region['lon'][1]):
                return True
        return False

def main():
    validator = StadiumValidator()
    is_valid, errors = validator.validate()
    
    if is_valid:
        logging.info("✅ Stadium data is valid and ready for use in Chrome plugin")
    else:
        logging.error("❌ Stadium data validation failed:")
        for error in errors:
            logging.error(f"  - {error}")

if __name__ == "__main__":
    main() 