import os
from .base import ArcGISClient

BHARATMAPS_BASE_URL = "https://mapservice.gov.in/mapserviceserv176/rest/services/Panchayat/AdminGPHierarchy/MapServer"

class BharatMapsClient(ArcGISClient):
    def __init__(self, ca_bundle_path: str = None):
        if ca_bundle_path is None:
            # Look for the generated CA bundle in the same directory
            ca_bundle_path = os.path.join(os.path.dirname(__file__), "bm_ca_bundle.pem")
        super().__init__(base_url=BHARATMAPS_BASE_URL, ca_bundle_path=ca_bundle_path)

    async def get_panchayat_polygons(self, state_lgd_code: int):
        """
        Fetch all Gram Panchayat polygons for a given state using pagination.
        Layer 3 is Gram Panchayat.
        """
        where = f"ST_LGD={state_lgd_code}"
        # We fetch GPCODE (the LGD code), blklgdcode (block code), and names
        out_fields = "GPCODE,GPNAME,ST_LGD,DT_LGD,blklgdcode"
        
        async for feature in self.query_layer(layer_id=3, where=where, out_fields=out_fields):
            yield feature
