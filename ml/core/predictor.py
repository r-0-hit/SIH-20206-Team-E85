"""
Predictive Risk Simulation module for the THERMOSAFE project.
"""

import math

def compute_risk_score(
    classification,
    frp,
    brightness,
    dist_to_industrial,
    persistence_score,
    is_night,
    thermal_anomaly_z_score=0.0,
    population_factor=0.0,
    anomaly_ratio=1.0
):
    """
    Computes a composite risk score out of 99.
    """
    # Fire type base score
    base_scores = {
        'INDUSTRIAL_ACCIDENTAL_FIRE': 82.0,
        'WILDFIRE': 65.0,
        'INDUSTRIAL_PERSISTENT': 35.0,
        'MINING_EXTRACTION': 52.0,
        'AGRICULTURAL_BURNING': 30.0,
        'OTHER': 10.0
    }
    
    score = base_scores.get(classification, 10.0)
    
    # FRP modifier (0 to 15 scaled from 0-500 MW)
    frp_mod = min(15.0, (frp / 500.0) * 15.0)
    score += frp_mod
    
    # Proximity modifier (+0-10 for < 2km)
    if dist_to_industrial is not None:
        if dist_to_industrial < 2.0:
            score += ((2.0 - dist_to_industrial) / 2.0) * 10.0
            
    # Thermal anomaly modifier (+0-12 based on z_score)
    if thermal_anomaly_z_score > 0:
        score += min(12.0, thermal_anomaly_z_score * 2.0)
        
    # Population modifier (+0-8 based on population_factor)
    score += min(8.0, population_factor * 8.0)
    
    # Nighttime modifier (+2 if is_night)
    if is_night:
        score += 2.0
        
    return int(max(0, min(99, round(score))))


class RiskPredictor:
    """
    Predictive risk simulation for future FRP and risk trends.
    """

    def estimate_future_frp(self, current_frp, growth_rate_pct, minutes, revisit_interval_min=90):
        """
        Estimates future FRP based on an exponential projection.
        Caps at 2000.0.
        """
        if current_frp <= 0:
            return 0.0
        projected = current_frp * (1.0 + growth_rate_pct / 100.0) ** (minutes / revisit_interval_min)
        return min(2000.0, projected)

    def project_risk_timeline(self, hotspot_data, baseline_result=None):
        """
        Projects risk scores across +30, +60, +120 minutes.
        """
        classification = hotspot_data.get('classification', 'OTHER')
        frp = hotspot_data.get('frp', 0.0)
        brightness = hotspot_data.get('brightness', 0.0)
        dist_to_industrial = hotspot_data.get('dist_to_industrial', 10.0)
        persistence_score = hotspot_data.get('persistence_score', 0.0)
        is_night = hotspot_data.get('is_night', False)
        z_score = hotspot_data.get('thermal_anomaly_z_score', 0.0)
        
        # Estimate growth rate
        if persistence_score < 0.2:
            growth_rate_pct = 30.0 + min(10.0, z_score * 2.0)  # Aggressive: 30-40%
        elif persistence_score > 0.6:
            growth_rate_pct = 5.0  # Stable industrial
        else:
            growth_rate_pct = 15.0  # Moderate
            
        current_risk = compute_risk_score(
            classification, frp, brightness, dist_to_industrial,
            persistence_score, is_night, z_score
        )
        
        frp_30 = self.estimate_future_frp(frp, growth_rate_pct, 30)
        frp_60 = self.estimate_future_frp(frp, growth_rate_pct, 60)
        frp_120 = self.estimate_future_frp(frp, growth_rate_pct, 120)
        
        risk_30 = compute_risk_score(
            classification, frp_30, brightness, dist_to_industrial,
            persistence_score, is_night, z_score
        )
        risk_60 = compute_risk_score(
            classification, frp_60, brightness, dist_to_industrial,
            persistence_score, is_night, z_score
        )
        risk_120 = compute_risk_score(
            classification, frp_120, brightness, dist_to_industrial,
            persistence_score, is_night, z_score
        )
        
        trend = 'STABLE'
        if risk_120 > current_risk + 10:
            trend = 'ESCALATING'
        elif risk_120 < current_risk - 5:
            trend = 'DECLINING'
            
        alert = None
        if trend == 'ESCALATING' and risk_120 >= 80:
            alert = '🔴 Potential escalation detected'
            
        lead_time_minutes = None
        times = [0, 30, 60, 120]
        risks = [current_risk, risk_30, risk_60, risk_120]
        for i in range(1, 4):
            if risks[i-1] < 80 and risks[i] >= 80:
                slope = (risks[i] - risks[i-1]) / (times[i] - times[i-1])
                if slope > 0:
                    lead_time_minutes = int(times[i-1] + (80 - risks[i-1]) / slope)
                else:
                    lead_time_minutes = times[i]
                break
            elif risks[i-1] >= 80 and lead_time_minutes is None:
                lead_time_minutes = times[i-1]
                break
                
        return {
            'current': current_risk,
            'min_30': risk_30,
            'min_60': risk_60,
            'min_120': risk_120,
            'trend': trend,
            'growth_rate_pct': growth_rate_pct,
            'alert': alert,
            'lead_time_minutes': lead_time_minutes
        }

    def run_whatif(self, base_frp, growth_rate_pct, persistence_score, population_thousands, distance_km, facility_type='chemical'):
        """
        Simulates a what-if scenario given slider values.
        """
        # Map facility type to pseudo classification
        classification_map = {
            'chemical': 'INDUSTRIAL_ACCIDENTAL_FIRE',
            'refinery': 'INDUSTRIAL_ACCIDENTAL_FIRE',
            'power': 'INDUSTRIAL_PERSISTENT',
            'steel': 'INDUSTRIAL_PERSISTENT',
            'warehouse': 'INDUSTRIAL_ACCIDENTAL_FIRE',
            'other': 'OTHER'
        }
        classification = classification_map.get(facility_type.lower(), 'OTHER')
        
        # Population factor 0-1, normalized at 100k
        population_factor = min(1.0, population_thousands / 100.0)
        
        # Z-score assumption based on growth rate
        z_score = 0.0
        if growth_rate_pct > 20:
            z_score = (growth_rate_pct - 20) / 10.0
            
        # Is night assumption
        is_night = False
        brightness = 300.0 + min(50.0, base_frp / 10.0)
        
        current_risk = compute_risk_score(
            classification=classification,
            frp=base_frp,
            brightness=brightness,
            dist_to_industrial=distance_km,
            persistence_score=persistence_score,
            is_night=is_night,
            thermal_anomaly_z_score=z_score,
            population_factor=population_factor
        )
        
        frp_30 = self.estimate_future_frp(base_frp, growth_rate_pct, 30)
        frp_60 = self.estimate_future_frp(base_frp, growth_rate_pct, 60)
        frp_120 = self.estimate_future_frp(base_frp, growth_rate_pct, 120)
        
        risk_30 = compute_risk_score(classification, frp_30, brightness, distance_km, persistence_score, is_night, z_score, population_factor)
        risk_60 = compute_risk_score(classification, frp_60, brightness, distance_km, persistence_score, is_night, z_score, population_factor)
        risk_120 = compute_risk_score(classification, frp_120, brightness, distance_km, persistence_score, is_night, z_score, population_factor)
        
        trend = 'STABLE'
        if risk_120 > current_risk + 10:
            trend = 'ESCALATING'
        elif risk_120 < current_risk - 5:
            trend = 'DECLINING'
            
        alert = None
        if trend == 'ESCALATING' and risk_120 >= 80:
            alert = '🔴 Potential escalation detected'
            
        lead_time_minutes = None
        times = [0, 30, 60, 120]
        risks = [current_risk, risk_30, risk_60, risk_120]
        for i in range(1, 4):
            if risks[i-1] < 80 and risks[i] >= 80:
                slope = (risks[i] - risks[i-1]) / (times[i] - times[i-1])
                if slope > 0:
                    lead_time_minutes = int(times[i-1] + (80 - risks[i-1]) / slope)
                else:
                    lead_time_minutes = times[i]
                break
            elif risks[i-1] >= 80 and lead_time_minutes is None:
                lead_time_minutes = times[i-1]
                break
                
        return {
            'current': current_risk,
            'min_30': risk_30,
            'min_60': risk_60,
            'min_120': risk_120,
            'trend': trend,
            'growth_rate_pct': growth_rate_pct,
            'alert': alert,
            'lead_time_minutes': lead_time_minutes
        }

risk_predictor = RiskPredictor()
