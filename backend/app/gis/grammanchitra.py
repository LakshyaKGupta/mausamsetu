import os
from .base import ArcGISClient

GRAMMANCHITRA_BASE_URL = "https://grammanchitragis.nic.in/grammanchitra/rest/services/panchayat/adminpanch/MapServer"

class GramManchitraClient(ArcGISClient):
    def __init__(self, ca_bundle_path: str = None):
        if ca_bundle_path is None:
            # Look for the generated CA bundle in the same directory
            ca_bundle_path = os.path.join(os.path.dirname(__file__), "nic_ca_bundle.pem")
        super().__init__(base_url=GRAMMANCHITRA_BASE_URL, ca_bundle_path=ca_bundle_path)

    async def get_panchayat_points(self, state_lgd_code: int):
        """
        Fetch Gram Panchayat points for a given state using pagination.
        Layer 4 is GP points.
        """
        where = f"ST_LGD={state_lgd_code}"
        # We fetch gp_code (the LGD code), gp_name, lat, lONG
        out_fields = "gp_code,gp_name,ST_LGD,DT_LGD,SDT_LGD,lat,lONG"
        
        async for feature in self.query_layer(layer_id=4, where=where, out_fields=out_fields, return_geometry=True):
            yield feature
