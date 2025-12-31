
import unittest
import time
from unittest.mock import MagicMock
# Adjust import assuming running from project root
import sys
import os
sys.path.append(os.path.abspath("app/processor/src"))
from decision_maker import DecisionMaker

class TestDecisionMaker(unittest.TestCase):
    def setUp(self):
        self.decision_maker = DecisionMaker(min_track_duration=0)

    def test_combined_confidence_high_agreement_high_conf(self):
        """
        Test case: High voting agreement, high classifier confidence.
        """
        tracks = {
            1: {
                'start_time': time.time(),
                'end_time': time.time() + 1,
                'preds': [('Cardinal', 0.9)] * 10,
                'best_frame': None
            }
        }
        
        results = self.decision_maker.get_results(tracks)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['species_name'], 'Cardinal')
        self.assertAlmostEqual(results[0]['confidence'], 0.9)

    def test_combined_confidence_high_agreement_low_conf(self):
        """
        Test case: High voting agreement, low classifier confidence.
        """
        tracks = {
            1: {
                'start_time': time.time(),
                'end_time': time.time() + 1,
                'preds': [('Cardinal', 0.4)] * 10,
                'best_frame': None
            }
        }
        
        results = self.decision_maker.get_results(tracks)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['species_name'], 'Cardinal')
        self.assertAlmostEqual(results[0]['confidence'], 0.4)

    def test_combined_confidence_mixed_voting(self):
        """
        Test case: Mixed voting.
        """
        preds = [('Cardinal', 0.9)] * 6 + [('Blue Jay', 0.8)] * 4
        tracks = {
            1: {
                'start_time': time.time(),
                'end_time': time.time() + 1,
                'preds': preds,
                'best_frame': None
            }
        }
        
        results = self.decision_maker.get_results(tracks)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['species_name'], 'Cardinal')
        # 0.6 * 0.9 = 0.54
        self.assertAlmostEqual(results[0]['confidence'], 0.54)

    def test_combined_confidence_mixed_voting_variable_conf(self):
        """
        Test case: Mixed voting with variable confidence.
        """
        preds = [('Cardinal', 0.9)] * 3 + [('Cardinal', 0.5)] * 3 + [('Blue Jay', 0.8)] * 4
        tracks = {
            1: {
                'start_time': time.time(),
                'end_time': time.time() + 1,
                'preds': preds,
                'best_frame': None
            }
        }
        
        results = self.decision_maker.get_results(tracks)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['species_name'], 'Cardinal')
        # Voting: 0.6. Avg Conf: (2.7 + 1.5)/6 = 0.7. Result: 0.42
        self.assertAlmostEqual(results[0]['confidence'], 0.42)

if __name__ == '__main__':
    unittest.main()
